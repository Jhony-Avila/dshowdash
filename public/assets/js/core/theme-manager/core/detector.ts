// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-detector
// PURPOSE: core   detector
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   safeLocalStorageGet, getSystemThemePreference, normalizeThemeId, STORAGE_KEY from ../utils/helpers.js
//   AVAILABLE_THEME_IDS, DEFAULT_THEME_ID from ../themes/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ThemeDetector — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   detectInitialTheme() — exported function
//   detectSystemThemeChange() — exported function
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
// Theme Manager - Detector v4.3.0-STRICT-MODE
// @changelog v4.3.0-STRICT-MODE - Migração para Strict Mode NR-FULL (elimina acessos window.* diretos)
// @changelog v4.2.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v4.1.0-P17WI - Logger via Ports Pattern

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { safeLocalStorageGet, getSystemThemePreference, normalizeThemeId, STORAGE_KEY } from '../utils/helpers.js';
import { AVAILABLE_THEME_IDS, DEFAULT_THEME_ID } from '../themes/index.js';

export var VERSION = '4.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-detector';

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

function _resolveMatchMedia() {
  // 1. Tenta via Ports
  var mm = _getPort('matchMedia');
  if (mm) return mm;
  // 2. Tenta via Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var mmFromAdapter = window.Core.windowAdapter.get('matchMedia');
    if (mmFromAdapter) return mmFromAdapter;
  }
  // 3. Fallback com controle strict
  var win = _resolveWindow();
  if (!win || typeof (win as Record<string, unknown>).matchMedia !== 'function') return null;
  if (isStrict()) {
    recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'matchMedia' });
    return null;
  }
  recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'matchMedia', fallback: true });
  return function(query: string) { return (win as Window).matchMedia(query); };
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

export function detectInitialTheme(options?: Record<string, unknown>): Record<string, unknown> {
  if (!options) options = {};
  var defaultThemeId = (options.defaultThemeId as string) || DEFAULT_THEME_ID;
  var availableThemeIds = (options.availableThemeIds as string[]) || AVAILABLE_THEME_IDS;
  var storageKey = (options.storageKey as string) || STORAGE_KEY;
  var respectSystemPreference = options.respectSystemPreference !== undefined ? options.respectSystemPreference : true;
  var themeId = defaultThemeId;
  var source = 'default';
  try {
    var userPreference = safeLocalStorageGet(storageKey);
    if (userPreference) {
      var normalized = normalizeThemeId(userPreference);
      if (normalized && availableThemeIds.indexOf(normalized) !== -1) { themeId = normalized; source = 'user'; return { themeId: themeId, source: source, detected: true }; }
    }
    if (respectSystemPreference) {
      var systemPreference = getSystemThemePreference();
      if (systemPreference !== 'unknown' && availableThemeIds.indexOf(systemPreference) !== -1) { themeId = systemPreference; source = 'system'; return { themeId: themeId, source: source, detected: true }; }
    }
    return { themeId: themeId, source: source, detected: false };
  } catch (error) { _log('warn', 'Detection error, using default:', (error as Error).message); return { themeId: defaultThemeId, source: 'default', detected: false, error: (error as Error).message }; }
}

export function detectSystemThemeChange(currentTheme: string, callback: (newTheme: string, source: string) => void): (() => void) | null {
  try {
    var matchMedia = _resolveMatchMedia() as ((query: string) => MediaQueryList) | null;
    if (!matchMedia) return null;
    var mediaQuery = matchMedia('(prefers-color-scheme: dark)');
    if (!mediaQuery) return null;
    var handler = function(event: MediaQueryListEvent): void { var newSystemTheme = event.matches ? 'dark' : 'light'; if (newSystemTheme !== currentTheme && typeof callback === 'function') callback(newSystemTheme, 'system'); };
    if (mediaQuery.addEventListener) { mediaQuery.addEventListener('change', handler); return function() { mediaQuery.removeEventListener('change', handler); }; }
    if ((mediaQuery as MediaQueryList & { addListener?: (fn: (e: MediaQueryListEvent) => void) => void }).addListener) { (mediaQuery as MediaQueryList & { addListener: (fn: (e: MediaQueryListEvent) => void) => void; removeListener: (fn: (e: MediaQueryListEvent) => void) => void }).addListener(handler); return function() { (mediaQuery as MediaQueryList & { addListener: (fn: (e: MediaQueryListEvent) => void) => void; removeListener: (fn: (e: MediaQueryListEvent) => void) => void }).removeListener(handler); }; }
    return null;
  } catch (error) { _log('warn', 'System theme listener setup failed:', (error as Error).message); return null; }
}

export var ThemeDetector = {
  detectInitialTheme: detectInitialTheme,
  detectSystemThemeChange: detectSystemThemeChange,
  getVersion: getVersion,
  healthCheck: function(): Record<string, unknown> { var detection = detectInitialTheme(); var logger = _getPort('logger'); return { healthy: true, version: VERSION, moduleId: MODULE_ID, detection: detection, loggerAvailable: !!logger, portsInitialized: _Ports.isInitialized(), strictMode: isStrict(), issues: null as null }; }
};

export default ThemeDetector;
