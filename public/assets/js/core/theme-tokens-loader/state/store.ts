// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-tokens-store
// PURPOSE: Theme Tokens Loader - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   TokensStore — exported object
//   injectPorts() — exported function
//   getPorts() — exported function
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 1.3.0-STRICT-MODE
// @changelog v1.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.2.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.1.0-P17WI - Logger via ports pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '1.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-tokens-store';

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
  if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; }
};

export function getVersion() { return VERSION; }

var _state = { version: VERSION, initialized: false, lastUpdated: null as unknown | null, tokensByGroup: {}, sources: { css: [] as unknown[], js: [] as unknown[] }, stats: { totalTokens: 0, groupCount: 0, cssSourcesLoaded: 0, jsSourcesLoaded: 0 } };

// @ts-expect-error TS migration - TS7023, TS7053
function deepClone(obj: Record<string, unknown>) { if (obj === null || typeof obj !== 'object') return obj; if (Array.isArray(obj)) return obj.map(deepClone); var cloned = {}; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) cloned[key] = deepClone(obj[key]); } return cloned; }

function recalculateStats() {
  var totalTokens = 0;
  var groups = Object.keys(_state.tokensByGroup);
  // @ts-expect-error strict migration — TS7053
  for (var i = 0; i < groups.length; i++) { var tokens = _state.tokensByGroup[groups[i]]; if (tokens && typeof tokens === 'object') totalTokens += Object.keys(tokens).length; }
  _state.stats.totalTokens = totalTokens;
  _state.stats.groupCount = groups.length;
  _state.stats.cssSourcesLoaded = _state.sources.css.length;
  _state.stats.jsSourcesLoaded = _state.sources.js.length;
}

export var TokensStore = {
  setTokens: function(groupName: unknown, tokens: Record<string, unknown>, sourceMeta: Record<string, unknown>) {
    if (!sourceMeta) sourceMeta = {};
    if (!groupName || typeof groupName !== 'string') { _log('warn', 'setTokens: invalid groupName'); return false; }
    try {
      // @ts-expect-error strict migration — TS7053
      _state.tokensByGroup[groupName] = deepClone(tokens || {});
      _state.lastUpdated = Date.now();
      if (sourceMeta.type === 'css' && sourceMeta.path) { if (_state.sources.css.indexOf(sourceMeta.path) === -1) _state.sources.css.push(sourceMeta.path); }
      else if (sourceMeta.type === 'js' && sourceMeta.path) { if (_state.sources.js.indexOf(sourceMeta.path) === -1) _state.sources.js.push(sourceMeta.path); }
      recalculateStats();
      return true;
    } catch (error) { _log('error', 'setTokens error:', error); return false; }
  },
  getTokens: function(groupName: string) { if (!groupName) return null; var tokens = (_state.tokensByGroup as Record<string, unknown>)[groupName]; return tokens ? deepClone(tokens as Record<string, unknown>) : null; },
  getAllTokens: function() { return deepClone(_state.tokensByGroup); },
  getGroups: function() { return Object.keys(_state.tokensByGroup); },
  hasGroup: function(groupName: string) { return groupName in _state.tokensByGroup; },
  getSources: function() { return deepClone(_state.sources); },
  getStats: function() { return Object.assign({}, _state.stats); },
  setInitialized: function(value: unknown) { _state.initialized = value !== false; if (_state.initialized) _state.lastUpdated = Date.now(); },
  isInitialized: function() { return _state.initialized; },
  getLastUpdated: function() { return _state.lastUpdated; },
  reset: function() { _state.initialized = false; _state.lastUpdated = null; _state.tokensByGroup = {}; _state.sources = { css: [], js: [] }; _state.stats = { totalTokens: 0, groupCount: 0, cssSourcesLoaded: 0, jsSourcesLoaded: 0 }; return true; },
  getSnapshot: function() { return { version: _state.version, initialized: _state.initialized, lastUpdated: _state.lastUpdated, groups: this.getGroups(), sources: this.getSources(), stats: this.getStats() }; },
  healthCheck: function() { return { healthy: true, version: VERSION, moduleId: MODULE_ID, initialized: _state.initialized, stats: this.getStats(), issues: null as unknown | null, loggerAvailable: !!_getLogger(), portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; }
};

export default TokensStore;
