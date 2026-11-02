// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-lifecycle
// PURPOSE: core   lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   ThemeEngine from ./engine.js
//   ThemeStore from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ThemeLifecycle — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Core
//   window.Logger
// ═══════════════════════════════════════════════════════════════
'use strict';
// Theme Manager - Lifecycle v4.3.0-STRICT-MODE
// @changelog v4.3.0-STRICT-MODE - Migração para Strict Mode NR-FULL (elimina acessos window.* diretos)
// @changelog v4.2.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v4.1.0-P17WI - Logger via Ports Pattern

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { ThemeEngine } from './engine.js';
import { ThemeStore } from '../state/store.js';

export var VERSION = '4.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-lifecycle';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

// === STRICT MODE RESOLVERS ===
function _resolveWindow() {
  // 1. Tenta via Ports
  var win = _getPort('window');
  if (win) return win;
  // 2. Tenta via Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var winFromAdapter = window.Core.windowAdapter.get('window');
    if (winFromAdapter) return winFromAdapter;
  }
  // 3. Fallback com controle strict
  if (isStrict()) {
    recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'window' });
    return null;
  }
  recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'window', fallback: true });
  return typeof window !== 'undefined' ? window : null;
}

function _resolveAppConfig() {
  // 1. Tenta via Ports
  var cfg = _getPort('appConfig');
  if (cfg) return cfg;
  // 2. Tenta via Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var cfgFromAdapter = window.Core.windowAdapter.get('APP_CONFIG');
    if (cfgFromAdapter) return cfgFromAdapter;
  }
  // 3. Fallback com controle strict
  var win = _resolveWindow();
  if (!win || !(win as Record<string, unknown>).APP_CONFIG) return null;
  if (isStrict()) {
    recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'APP_CONFIG' });
    return null;
  }
  recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'APP_CONFIG', fallback: true });
  return (win as Record<string, unknown>).APP_CONFIG;
}

var _debug = function(): unknown { var cfg = _resolveAppConfig(); return cfg && (cfg as Record<string, unknown>).app && ((cfg as Record<string, Record<string, unknown>>).app).debug; };
var _log = function(level: string, ...rest: unknown[]): void {
  var args = Array.prototype.slice.call(arguments, 1);
  var logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if ((logger as Record<string, unknown>).error) (logger as { error: (...a: unknown[]) => void }).error.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; }
  if (level === 'warn') { if ((logger as Record<string, unknown>).warn) (logger as { warn: (...a: unknown[]) => void }).warn.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; }
  if (_debug() && (logger as Record<string, unknown>).debug) (logger as { debug: (...a: unknown[]) => void }).debug.apply(logger, ['[' + MODULE_ID + ']'].concat(args));
};

export function getVersion(): string { return VERSION; }

var _lifecycleState: { initialized: boolean; destroyed: boolean; initCount: number; resetCount: number; lastInitAt: number | null; lastResetAt: number | null; config: Record<string, unknown> | null } = { initialized: false, destroyed: false, initCount: 0, resetCount: 0, lastInitAt: null, lastResetAt: null, config: null };

export var ThemeLifecycle = {
  init: function(config: Record<string, unknown>): Record<string, unknown> {
    if (!config) config = {};
    if (_lifecycleState.initialized && !_lifecycleState.destroyed) return { success: true, alreadyInitialized: true, themeId: ThemeStore.get('currentTheme'), initCount: _lifecycleState.initCount };
    try {
      _lifecycleState.config = config;
      _lifecycleState.destroyed = false;
      var result = ThemeEngine.init(config);
      if (result.success) { _lifecycleState.initialized = true; _lifecycleState.initCount++; _lifecycleState.lastInitAt = Date.now(); }
      return { success: result.success, alreadyInitialized: false, themeId: result.themeId, source: result.source, initCount: _lifecycleState.initCount, error: result.error };
    } catch (error) { _log('error', 'Init error:', error); return { success: false, error: (error as Error).message }; }
  },
  reset: function(): Record<string, unknown> {
    try {
      var result = ThemeEngine.reset();
      _lifecycleState.resetCount++;
      _lifecycleState.lastResetAt = Date.now();
      return { success: true, resetCount: _lifecycleState.resetCount, themeId: result.themeId };
    } catch (error) { _log('error', 'Reset error:', error); return { success: false, error: (error as Error).message }; }
  },
  cleanup: function(): Record<string, unknown> { try { ThemeEngine.cleanup(); _lifecycleState.destroyed = true; _lifecycleState.initialized = false; return { success: true }; } catch (error) { _log('error', 'Cleanup error:', error); return { success: false, error: (error as Error).message }; } },
  destroy: function(): Record<string, unknown> { return this.cleanup(); },
  isInitialized: function(): boolean { return _lifecycleState.initialized && !_lifecycleState.destroyed; },
  getStatus: function(): Record<string, unknown> { return { initialized: _lifecycleState.initialized, destroyed: _lifecycleState.destroyed, initCount: _lifecycleState.initCount, resetCount: _lifecycleState.resetCount, lastInitAt: _lifecycleState.lastInitAt, lastResetAt: _lifecycleState.lastResetAt, currentTheme: ThemeStore.get('currentTheme'), engineInitialized: ThemeEngine.isInitialized() }; },
  healthCheck: function(): Record<string, unknown> {
    var engineHealth = ThemeEngine.healthCheck();
    var storeHealth = ThemeStore.healthCheck();
    var allHealthy = engineHealth.healthy && storeHealth.healthy;
    var logger = _getPort('logger');
    return { healthy: allHealthy && _lifecycleState.initialized, version: VERSION, moduleId: MODULE_ID, status: this.getStatus(), components: { engine: engineHealth, store: storeHealth }, loggerAvailable: !!logger, portsInitialized: _Ports.isInitialized(), strictMode: isStrict(), issues: !_lifecycleState.initialized ? 'Not initialized' : (allHealthy ? null : 'Component issues') };
  }
};

export default ThemeLifecycle;
