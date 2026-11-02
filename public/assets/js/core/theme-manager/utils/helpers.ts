// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-helpers
// PURPOSE: Theme Manager - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STORAGE_KEY — exported value
//   ThemeHelpers — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   normalizeThemeId() — exported function
//   isValidThemeId() — exported function
//   safeParseTheme() — exported function
//   safeLocalStorageGet() — exported function
//   safeLocalStorageSet() — exported function
//   safeLocalStorageRemove() — exported function
//   getSystemThemePreference() — exported function
//   hasDOMSupport() — exported function
//   hasMatchMediaSupport() — exported function
//   buildThemeContext() — exported function
//   mergeTokens() — exported function
//   debounce() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
//   window.Core
//   window.Logger
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '4.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-helpers';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

var _log = function(level: string, ...rest: unknown[]): void { var logger = _getPort('logger'); if (!logger) return; var args = Array.prototype.slice.call(arguments, 1); var prefix = '[' + MODULE_ID + ']'; if (level === 'error') { if ((logger as Record<string, unknown>).error) (logger as { error: (...a: unknown[]) => void }).error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if ((logger as Record<string, unknown>).warn) (logger as { warn: (...a: unknown[]) => void }).warn.apply(logger, [prefix].concat(args)); return; } };

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

function _resolveLocalStorage() {
  // 1. Tenta via Ports
  var ls = _getPort('localStorage');
  if (ls) return ls;
  // 2. Tenta via Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var lsFromAdapter = window.Core.windowAdapter.get('localStorage');
    if (lsFromAdapter) return lsFromAdapter;
  }
  // 3. Fallback com controle strict
  var win = _resolveWindow();
  if (!win) return null;
  if (isStrict()) {
    recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'localStorage' });
    return null;
  }
  recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'localStorage', fallback: true });
  return (win as Window).localStorage || null;
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
  return function(query: string): MediaQueryList { return (win as Window).matchMedia(query); };
}

export function getVersion(): string { return VERSION; }

export var STORAGE_KEY = 'dshowdash-theme';

export function normalizeThemeId(id: string): string | null { if (!id || typeof id !== 'string') return null; return id.toLowerCase().trim(); }
export function isValidThemeId(id: string, availableIds?: string[]): boolean { if (!availableIds) availableIds = []; if (!id || typeof id !== 'string') return false; var normalized = normalizeThemeId(id); return availableIds.indexOf(normalized as string) > -1; }
export function safeParseTheme(value: string, fallback?: string): string { if (!fallback) fallback = 'dark'; if (!value || typeof value !== 'string') return fallback; return value.trim() || fallback; }

export function safeLocalStorageGet(key: string): string | null { try { var ls = _resolveLocalStorage() as Storage | null; if (!ls) return null; return ls.getItem(key); } catch (error) { _log('warn', 'localStorage get failed:', (error as Error).message); return null; } }
export function safeLocalStorageSet(key: string, value: string): boolean { try { var ls = _resolveLocalStorage() as Storage | null; if (!ls) return false; ls.setItem(key, value); return true; } catch (error) { _log('warn', 'localStorage set failed:', (error as Error).message); return false; } }
export function safeLocalStorageRemove(key: string): boolean { try { var ls = _resolveLocalStorage() as Storage | null; if (!ls) return false; ls.removeItem(key); return true; } catch (error) { _log('warn', 'localStorage remove failed:', (error as Error).message); return false; } }

export function getSystemThemePreference(): string { try { var matchMedia = _resolveMatchMedia() as ((query: string) => MediaQueryList) | null; if (!matchMedia) return 'unknown'; var darkMatcher = matchMedia('(prefers-color-scheme: dark)'); var lightMatcher = matchMedia('(prefers-color-scheme: light)'); if (darkMatcher && darkMatcher.matches) return 'dark'; if (lightMatcher && lightMatcher.matches) return 'light'; return 'unknown'; } catch (error) { _log('warn', 'System theme detection failed:', (error as Error).message); return 'unknown'; } }

export function hasDOMSupport(): boolean { var win = _resolveWindow(); return !!win && typeof document !== 'undefined'; }
export function hasMatchMediaSupport(): boolean { var mm = _resolveMatchMedia(); return !!mm; }
export function buildThemeContext(themeId: string, source: string): Record<string, unknown> { return { themeId: themeId, source: source, timestamp: Date.now(), systemPreference: getSystemThemePreference(), hasDOMSupport: hasDOMSupport() }; }
export function mergeTokens(baseTokens: Record<string, string>, overrideTokens: Record<string, string>): Record<string, string> { if (!baseTokens) return overrideTokens || {}; if (!overrideTokens) return baseTokens; return Object.assign({}, baseTokens, overrideTokens); }
export function debounce(fn: (...args: unknown[]) => void, delay?: number): (...args: unknown[]) => void { if (!delay) delay = 100; var timeoutId: ReturnType<typeof setTimeout> | null = null; return function(this: unknown): void { var self = this; var args = arguments; if (timeoutId) clearTimeout(timeoutId); timeoutId = setTimeout(function() { fn.apply(self, Array.prototype.slice.call(args)); timeoutId = null; }, delay); }; }

export var ThemeHelpers = { STORAGE_KEY: STORAGE_KEY, normalizeThemeId: normalizeThemeId, isValidThemeId: isValidThemeId, safeParseTheme: safeParseTheme, safeLocalStorageGet: safeLocalStorageGet, safeLocalStorageSet: safeLocalStorageSet, safeLocalStorageRemove: safeLocalStorageRemove, getSystemThemePreference: getSystemThemePreference, hasDOMSupport: hasDOMSupport, hasMatchMediaSupport: hasMatchMediaSupport, buildThemeContext: buildThemeContext, mergeTokens: mergeTokens, debounce: debounce, getVersion: getVersion, healthCheck: function(): Record<string, unknown> { return { healthy: true, version: VERSION, moduleId: MODULE_ID, hasDOMSupport: hasDOMSupport(), hasMatchMediaSupport: hasMatchMediaSupport(), systemPreference: getSystemThemePreference(), issues: null as null, loggerAvailable: !!_getPort('logger'), portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; } };

export default ThemeHelpers;
