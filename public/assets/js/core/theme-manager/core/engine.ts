// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-engine
// PURPOSE: Theme Manager - Engine
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   ThemeStore from ../state/store.js
//   ThemeCatalog, getThemeById, isValidThemeId, DEFAULT_THEME_ID from ../themes/index.js
//   ThemeDetector, detectInitialTheme, detectSystemThemeChange from ./detector.js
//   ThemeApplier, applyTheme, getCurrentAppliedTheme from ./applier.js
//   safeLocalStorageSet, safeLocalStorageRemove, STORAGE_KEY from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ThemeEngine — exported value
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
//   window.Logger
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { ThemeStore } from '../state/store.js';
import { ThemeCatalog, getThemeById, isValidThemeId, DEFAULT_THEME_ID } from '../themes/index.js';
import { ThemeDetector, detectInitialTheme, detectSystemThemeChange } from './detector.js';
import { ThemeApplier, applyTheme, getCurrentAppliedTheme } from './applier.js';
import { safeLocalStorageSet, safeLocalStorageRemove, STORAGE_KEY } from '../utils/helpers.js';

export var VERSION = '4.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-engine';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

var _log = function(level: string, ...rest: unknown[]): void { var logger = _getPort('logger'); if (!logger) return; var args = Array.prototype.slice.call(arguments, 1); var prefix = '[' + MODULE_ID + ']'; if (level === 'error') { if ((logger as Record<string, unknown>).error) (logger as { error: (...a: unknown[]) => void }).error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if ((logger as Record<string, unknown>).warn) (logger as { warn: (...a: unknown[]) => void }).warn.apply(logger, [prefix].concat(args)); return; } };

export function getVersion(): string { return VERSION; }

var _engineState: { initialized: boolean; config: Record<string, unknown> | null; systemThemeCleanup: (() => void) | null; lastError: string | null } = { initialized: false, config: null, systemThemeCleanup: null, lastError: null };

export var ThemeEngine = {
  init: function(config: Record<string, unknown>): Record<string, unknown> {
    if (!config) config = {};
    var defaultThemeId = (config.defaultThemeId as string) || DEFAULT_THEME_ID;
    var storageKey = (config.storageKey as string) || STORAGE_KEY;
    var respectSystemPreference = config.respectSystemPreference !== false;
    var listenToSystemChanges = config.listenToSystemChanges !== false;
    var applyTokensOpt = config.applyTokens !== false;
    try {
      _engineState.config = { defaultThemeId: defaultThemeId, storageKey: storageKey, respectSystemPreference: respectSystemPreference, applyTokens: applyTokensOpt };
      var detection = detectInitialTheme({ defaultThemeId: defaultThemeId, storageKey: storageKey, respectSystemPreference: respectSystemPreference });
      var theme = getThemeById(detection.themeId as string) as Record<string, unknown> | null;
      if (!theme) throw new Error('Theme not found: ' + detection.themeId);
      ThemeStore.set({ currentTheme: detection.themeId as string, source: detection.source as string, isApplying: true, error: null });
      var applyResult = applyTheme(theme, { applyTokens: applyTokensOpt });
      ThemeStore.set({ isApplying: false });
      if (detection.source === 'user' || detection.source === 'default') safeLocalStorageSet(storageKey, detection.themeId as string);
      if (listenToSystemChanges && respectSystemPreference) this._setupSystemThemeListener();
      _engineState.initialized = true;
      _engineState.lastError = null;
      return { success: true, themeId: detection.themeId, source: detection.source, applied: applyResult.applied };
    } catch (error) {
      _log('error', 'Init error:', error);
      _engineState.lastError = (error as Error).message;
      ThemeStore.set({ error: (error as Error).message, isApplying: false });
      return { success: false, error: (error as Error).message, themeId: defaultThemeId };
    }
  },

  changeTheme: function(themeId: string, source: string): Record<string, unknown> {
    if (!source) source = 'user';
    try {
      if (!isValidThemeId(themeId)) { _log('warn', 'Invalid theme:', themeId); return { success: false, error: 'invalid-theme' }; }
      var currentState = ThemeStore.getState();
      if (currentState.currentTheme === themeId) return { success: true, changed: false, reason: 'already-current' };
      var theme = getThemeById(themeId) as Record<string, unknown> | null;
      if (!theme) return { success: false, error: 'theme-not-found' };
      ThemeStore.set({ currentTheme: themeId, source: source, isApplying: true, error: null });
      var applyResult = applyTheme(theme, { applyTokens: _engineState.config ? _engineState.config.applyTokens !== false : true });
      ThemeStore.set({ isApplying: false });
      if (source === 'user') { var storageKey = _engineState.config ? (_engineState.config.storageKey as string) : STORAGE_KEY; safeLocalStorageSet(storageKey, themeId); }
      return { success: true, changed: true, themeId: themeId, source: source, applied: applyResult.applied };
    } catch (error) { _log('error', 'Change theme error:', error); ThemeStore.set({ error: (error as Error).message, isApplying: false }); return { success: false, error: (error as Error).message }; }
  },

  toggleTheme: function(): Record<string, unknown> { var currentState = ThemeStore.getState(); var newTheme = currentState.currentTheme === 'dark' ? 'light' : 'dark'; return this.changeTheme(newTheme, 'user'); },
  getCurrentTheme: function(): Record<string, unknown> { return ThemeStore.getState(); },
  getAvailableThemes: function(): unknown { return ThemeCatalog.getAllThemes(); },

  _setupSystemThemeListener: function(): void {
    var self = this;
    if (_engineState.systemThemeCleanup) _engineState.systemThemeCleanup();
    var currentTheme = ThemeStore.get('currentTheme') as string;
    _engineState.systemThemeCleanup = detectSystemThemeChange(currentTheme, function(newTheme: string, source: string): void { var currentSource = ThemeStore.get('source'); if (currentSource === 'system') self.changeTheme(newTheme, 'system'); });
  },

  reset: function(): Record<string, unknown> {
    var defaultThemeId = _engineState.config ? (_engineState.config.defaultThemeId as string) : DEFAULT_THEME_ID;
    var storageKey = _engineState.config ? (_engineState.config.storageKey as string) : STORAGE_KEY;
    safeLocalStorageRemove(storageKey);
    (ThemeStore as Record<string, unknown> & { reset: (id: string) => void }).reset(defaultThemeId);
    var theme = getThemeById(defaultThemeId) as Record<string, unknown> | null;
    if (theme) applyTheme(theme);
    return { success: true, themeId: defaultThemeId };
  },

  cleanup: function(): void { if (_engineState.systemThemeCleanup) { _engineState.systemThemeCleanup(); _engineState.systemThemeCleanup = null; } _engineState.initialized = false; },
  isInitialized: function(): boolean { return _engineState.initialized; },
  healthCheck: function(): Record<string, unknown> { return { healthy: _engineState.initialized && !_engineState.lastError, version: VERSION, moduleId: MODULE_ID, initialized: _engineState.initialized, currentTheme: ThemeStore.get('currentTheme'), appliedTheme: getCurrentAppliedTheme(), lastError: _engineState.lastError, issues: _engineState.lastError ? _engineState.lastError : null as null, loggerAvailable: !!_getPort('logger'), portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; }
};

export default ThemeEngine;
