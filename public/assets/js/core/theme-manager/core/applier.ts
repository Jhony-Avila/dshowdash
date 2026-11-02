// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-applier
// PURPOSE: Theme Manager - Applier
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   hasDOMSupport from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ThemeApplier — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   applyTheme() — exported function
//   getCurrentAppliedTheme() — exported function
//   removeTheme() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { hasDOMSupport } from '../utils/helpers.js';

export var VERSION = '4.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-applier';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

var _log = function(level: string, ...rest: unknown[]): void { var logger = _getPort('logger'); if (!logger) return; var args = Array.prototype.slice.call(arguments, 1); var prefix = '[' + MODULE_ID + ']'; if (level === 'error') { if ((logger as Record<string, unknown>).error) (logger as { error: (...a: unknown[]) => void }).error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if ((logger as Record<string, unknown>).warn) (logger as { warn: (...a: unknown[]) => void }).warn.apply(logger, [prefix].concat(args)); return; } };

// === STRICT MODE RESOLVERS ===
function _resolveDocument() {
  // 1. Tenta via Ports
  var doc = _getPort('document');
  if (doc) return doc;
  // 2. Tenta via Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var docFromAdapter = window.Core.windowAdapter.get('document');
    if (docFromAdapter) return docFromAdapter;
  }
  // 3. Fallback com controle strict
  if (isStrict()) {
    recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'document' });
    return null;
  }
  recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'document', fallback: true });
  return typeof document !== 'undefined' ? document : null;
}

export function getVersion(): string { return VERSION; }

var THEME_ATTRIBUTE = 'data-theme';
var TRANSITION_CLASS = 'theme-transitioning';

export function applyTheme(theme: Record<string, unknown>, options?: Record<string, unknown>): Record<string, unknown> {
  if (!options) options = {};
  var applyTokens = options.applyTokens !== false;
  var useTransition = options.useTransition !== false;
  var transitionDuration = (options.transitionDuration as number) || 200;
  if (!hasDOMSupport()) { _log('warn', 'No DOM support, skipping apply'); return { applied: false, reason: 'no-dom' }; }
  if (!theme || !theme.id) { _log('warn', 'Invalid theme object'); return { applied: false, reason: 'invalid-theme' }; }
  try {
    var doc = _resolveDocument() as Document | null;
    if (!doc) { _log('warn', 'Document not available'); return { applied: false, reason: 'no-document' }; }
    var root = doc.documentElement;
    var currentTheme = root.getAttribute(THEME_ATTRIBUTE);
    if (currentTheme === theme.cssVariant) return { applied: false, reason: 'already-applied', themeId: theme.id };
    if (useTransition) root.classList.add(TRANSITION_CLASS);
    root.setAttribute(THEME_ATTRIBUTE, theme.cssVariant as string);
    if (applyTokens && theme.tokens) applyTokensToRoot(theme.tokens as Record<string, string>, doc);
    if (useTransition) setTimeout(function() { root.classList.remove(TRANSITION_CLASS); }, transitionDuration);
    updateMetaThemeColor(theme, doc);
    return { applied: true, themeId: theme.id, previousTheme: currentTheme };
  } catch (error) { _log('error', 'Apply error:', error); return { applied: false, reason: 'error', error: (error as Error).message }; }
}

function applyTokensToRoot(tokens: Record<string, string>, doc: Document): void {
  if (!tokens || typeof tokens !== 'object') return;
  var d = doc || (_resolveDocument() as Document | null);
  if (!d) return;
  var root = d.documentElement;
  for (var property in tokens) { if (tokens.hasOwnProperty(property) && property.indexOf('--') === 0) root.style.setProperty(property, tokens[property]); }
}

function updateMetaThemeColor(theme: Record<string, unknown>, doc: Document): void {
  try {
    var d = doc || (_resolveDocument() as Document | null);
    if (!d) return;
    var metaThemeColor = d.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!metaThemeColor) { metaThemeColor = d.createElement('meta') as HTMLMetaElement; (metaThemeColor as HTMLMetaElement).name = 'theme-color'; d.head.appendChild(metaThemeColor); }
    var tokens = theme.tokens as Record<string, string> | undefined;
    var themeColor = (tokens && tokens['--bg-primary']) || (tokens && tokens['--dark']) || '#0a0e27';
    (metaThemeColor as HTMLMetaElement).content = themeColor;
  } catch (error) {}
}

export function getCurrentAppliedTheme(): string | null { if (!hasDOMSupport()) return null; try { var doc = _resolveDocument() as Document | null; if (!doc) return null; return doc.documentElement.getAttribute(THEME_ATTRIBUTE); } catch (error) { return null; } }
export function removeTheme(): boolean { if (!hasDOMSupport()) return false; try { var doc = _resolveDocument() as Document | null; if (!doc) return false; doc.documentElement.removeAttribute(THEME_ATTRIBUTE); return true; } catch (error) { return false; } }

export var ThemeApplier = { applyTheme: applyTheme, getCurrentAppliedTheme: getCurrentAppliedTheme, removeTheme: removeTheme, THEME_ATTRIBUTE: THEME_ATTRIBUTE, getVersion: getVersion, healthCheck: function(): Record<string, unknown> { return { healthy: true, version: VERSION, moduleId: MODULE_ID, currentApplied: getCurrentAppliedTheme(), hasDOMSupport: hasDOMSupport(), issues: null as null, loggerAvailable: !!_getPort('logger'), portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; } };

export default ThemeApplier;
