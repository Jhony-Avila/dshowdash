// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-tokens-registry
// PURPOSE: Theme Tokens Loader - Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   TokensStore from ../state/store.js
//   countTokens from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   TOKEN_GROUPS — exported constant
//   TokensRegistry — exported object
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
import { TokensStore } from '../state/store.js';
import { countTokens } from '../utils/helpers.js';

export var VERSION = '1.3.0-STRICT-MODE';
export var MODULE_ID = 'theme-tokens-registry';

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

export var TOKEN_GROUPS = { GLOBAL_TOKENS: 'global.tokens', GLOBAL_EXTENDED: 'global.extended', COMPONENT_MAIN: 'component.main', COMPONENT_LOGIN: 'component.login-modal', COMPONENT_SIDEBAR: 'component.sidebar', COMPONENT_TICKER: 'component.header.ticker' };

var _groupMeta = {};

export var TokensRegistry = {
  registerTokens: function(groupName: unknown, tokenMap: unknown, meta: Record<string, unknown>) {
    if (!meta) meta = {};
    if (!groupName || typeof groupName !== 'string') { _log('warn', 'registerTokens: invalid groupName'); return { success: false, error: 'invalid-group-name' }; }
    if (!tokenMap || typeof tokenMap !== 'object') { _log('warn', 'registerTokens: invalid tokenMap'); return { success: false, error: 'invalid-token-map' }; }
    try {
      var success = TokensStore.setTokens(groupName, tokenMap as Record<string, unknown>, meta);
      // @ts-expect-error strict migration — TS7053
      if (success) _groupMeta[groupName] = { registeredAt: Date.now(), source: meta.path || meta.source || 'unknown', type: meta.type || 'unknown', tokenCount: countTokens(tokenMap as Record<string, unknown>) };
      return { success: success, groupName: groupName, tokenCount: countTokens(tokenMap as Record<string, unknown>) };
    } catch (error: any) { _log('error', 'registerTokens error:', error); return { success: false, error: error.message }; }
  },
  getTokens: function(groupName: string) { return TokensStore.getTokens(groupName); },
  getAllGroups: function() { return TokensStore.getGroups(); },
  getAllTokens: function() { return TokensStore.getAllTokens(); },
  getGroupMeta: function(groupName: string) { return (_groupMeta as Record<string, unknown>)[groupName] || null; },
  getAllMeta: function() { return Object.assign({}, _groupMeta); },
  hasGroup: function(groupName: string) { return TokensStore.hasGroup(groupName); },
  getTokensByPattern: function(pattern: unknown) {
    if (!pattern) return {};
    var allTokens = TokensStore.getAllTokens();
    var result = {};
    // @ts-expect-error TS migration - TS7053
    for (var group in allTokens) { if (allTokens.hasOwnProperty(group) && (group.indexOf(pattern) > -1 || group.indexOf(pattern) === 0)) result[group] = allTokens[group]; }
    return result;
  },
  getComponentTokens: function() { return this.getTokensByPattern('component.'); },
  getGlobalTokens: function() { return this.getTokensByPattern('global.'); },
  // @ts-expect-error strict migration — TS7053
  clearRegistry: function() { TokensStore.reset(); for (var key in _groupMeta) delete _groupMeta[key]; return true; },
  getSummary: function() {
    var groups = this.getAllGroups();
    var summary = { totalGroups: groups.length, totalTokens: 0, groups: {} };
    // @ts-expect-error strict migration — TS7053
    for (var i = 0; i < groups.length; i++) { var group = groups[i]; var meta = _groupMeta[group] || {}; var tokens = TokensStore.getTokens(group); var tokenCount = tokens ? Object.keys(tokens).length : 0; summary.groups[group] = { tokenCount: tokenCount, source: meta.source, type: meta.type }; summary.totalTokens += tokenCount; }
    return summary;
  },
  healthCheck: function() { var summary = this.getSummary(); return { healthy: true, version: VERSION, moduleId: MODULE_ID, totalGroups: summary.totalGroups, totalTokens: summary.totalTokens, issues: null as unknown | null, loggerAvailable: !!_getLogger(), portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; }
};

export default TokensRegistry;
