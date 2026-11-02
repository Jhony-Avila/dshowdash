// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-tokens-css-parser
// PURPOSE: Theme Tokens Loader - CSS Parser
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   extractCssVariables() — exported function
//   normalizeTokenName() — exported function
//   parseCssToTokens() — exported function
//   categorizeTokens() — exported function
//   extractTokensFromDOM() — exported function
//   CssParser — exported object
//   injectPorts() — exported function
//   getPorts() — exported function
//
// WINDOW ACCESS: (none)
//   window.getComputedStyle (DOM API - always allowed)
//   document.documentElement (DOM API - always allowed)
// ═══════════════════════════════════════════════════════════════
// @version 1.3.0-STRICT-MODE
// @changelog v1.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.2.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.1.0-P17WI - Logger via ports pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '1.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-tokens-css-parser';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  var portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording

  return null;
}

var _log = function(level: string, ...rest: any[]) {
  var logger = _getLogger();
  if (!logger) return;
  var args = Array.prototype.slice.call(arguments, 1);
  var prefix = '[' + MODULE_ID + ']';
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; }
};

export function getVersion() { return VERSION; }

var CSS_VAR_REGEX = /--[\w-]+\s*:\s*[^;]+/g;
var CSS_VAR_SPLIT_REGEX = /^(--[\w-]+)\s*:\s*(.+)$/;

export function extractCssVariables(cssString: string, options?: Record<string, unknown>) {
  if (!options) options = {};
  var prefix = options.prefix !== undefined ? options.prefix : '--';
  var includeComments = options.includeComments || false;
  if (!cssString || typeof cssString !== 'string') return {};
  var result = {};
  try {
    var cleanCss = cssString;
    if (!includeComments) cleanCss = cssString.replace(/\/\*[\s\S]*?\*\//g, '');
    var matches = cleanCss.match(CSS_VAR_REGEX);
    if (!matches) return result;
    for (var i = 0; i < matches.length; i++) {
      var parts = matches[i].match(CSS_VAR_SPLIT_REGEX);
      // @ts-expect-error TS migration - TS7053
      if (parts && parts.length === 3) { var varName = parts[1].trim(); var varValue = parts[2].trim(); if (prefix && varName.indexOf(prefix) !== 0) continue; result[varName] = varValue; }
    }
  } catch (error: any) { _log('warn', 'Parse error:', error.message); }
  return result;
}

export function normalizeTokenName(cssVarName: unknown, options: Record<string, unknown>) {
  if (!options) options = {};
  var removePrefix = options.removePrefix !== false;
  var prefix = (options.prefix as string) || '--';
  if (!cssVarName || typeof cssVarName !== 'string') return cssVarName;
  var name = cssVarName;
  if (removePrefix && name.indexOf(prefix) === 0) name = name.substring(prefix.length);
  name = name.replace(/-/g, '.');
  return name;
}

export function parseCssToTokens(cssString: unknown, options: Record<string, unknown>) {
  if (!options) options = {};
  var group = options.group || 'global';
  var source = options.source || 'unknown';
  var variables = extractCssVariables(cssString as string);
  var tokens = {};
  // @ts-expect-error strict migration — TS7053
  for (var varName in variables) { if (variables.hasOwnProperty(varName)) tokens[varName] = variables[varName]; }
  return { group: group, source: source, tokens: tokens, count: Object.keys(tokens).length, extractedAt: Date.now() };
}

export function categorizeTokens(tokens: Record<string, unknown>) {
  var categories = { colors: {}, spacing: {}, typography: {}, shadows: {}, borders: {}, transitions: {}, zIndex: {}, other: {} };
  var categoryPatterns = { colors: /^--(color|primary|secondary|success|warning|danger|info|dark|light|white|muted|bg|text|glass|particles)/, spacing: /^--(spacing|padding|margin|gap)/, typography: /^--(font|text|leading)/, shadows: /^--shadow/, borders: /^--(border|radius)/, transitions: /^--transition/, zIndex: /^--z-/ };
  for (var varName in tokens) {
    if (!tokens.hasOwnProperty(varName)) continue;
    var categorized = false;
    // @ts-expect-error strict migration — TS7053
    for (var category in categoryPatterns) { if (categoryPatterns[category].test(varName)) { categories[category][varName] = tokens[varName]; categorized = true; break; } }
    // @ts-expect-error strict migration — TS7053
    if (!categorized) categories.other[varName] = tokens[varName];
  }
  return categories;
}

export function extractTokensFromDOM() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return {};
  try {
    var root = document.documentElement;
    var computedStyle = window.getComputedStyle(root);
    var tokens = {};
    // @ts-expect-error strict migration — TS7053
    for (var i = 0; i < computedStyle.length; i++) { var prop = computedStyle[i]; if (prop.indexOf('--') === 0) tokens[prop] = computedStyle.getPropertyValue(prop).trim(); }
    return tokens;
  } catch (error: any) { _log('warn', 'DOM extraction error:', error.message); return {}; }
}

export var CssParser = { extractCssVariables: extractCssVariables, normalizeTokenName: normalizeTokenName, parseCssToTokens: parseCssToTokens, categorizeTokens: categorizeTokens, extractTokensFromDOM: extractTokensFromDOM, getVersion: getVersion, healthCheck: function() { return { healthy: true, version: VERSION, moduleId: MODULE_ID, issues: null as unknown | null, loggerAvailable: !!_getLogger(), portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; } };

export default CssParser;
