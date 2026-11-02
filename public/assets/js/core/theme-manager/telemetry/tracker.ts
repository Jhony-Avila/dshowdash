// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-telemetry
// PURPOSE: telemetry   tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NAMESPACE — exported value
//   ThemeTelemetry — exported value
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
// Theme Manager - Telemetry Tracker v4.4.0-STRICT-MODE
// @changelog v4.4.0-STRICT-MODE - Migração para Strict Mode NR-FULL (elimina acessos window.* diretos)
// @changelog v4.3.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v4.2.0-P17WI - Logger via Ports Pattern

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '4.4.0-STRICT-MODE';
export var MODULE_ID = 'theme-telemetry';
export var NAMESPACE = 'theme-manager';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

export function getVersion(): string { return VERSION; }

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

function _resolveTelemetry() {
  // 1. Tenta via Ports
  var tel = _getPort('telemetry');
  if (tel) return tel;
  // 2. Tenta via Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var telFromAdapter = window.Core.windowAdapter.get('Telemetry');
    if (telFromAdapter) return telFromAdapter;
  }
  // 3. Fallback com controle strict
  var win = _resolveWindow();
  if (!win || !(win as Record<string, unknown>).Telemetry) return null;
  if (isStrict()) {
    recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'Telemetry' });
    return null;
  }
  recordViolation('WINDOW_DIRECT_ACCESS', { moduleId: MODULE_ID, target: 'Telemetry', fallback: true });
  return (win as Record<string, unknown>).Telemetry;
}

var _debug = function(): unknown { var cfg = _resolveAppConfig(); return cfg && (cfg as Record<string, unknown>).app && ((cfg as Record<string, Record<string, unknown>>).app).debug; };
var _log = function(level: string, ...rest: unknown[]): void {
  var args = Array.prototype.slice.call(arguments, 1);
  var logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if ((logger as Record<string, unknown>).error) (logger as { error: (...a: unknown[]) => void }).error.apply(logger, ['[' + NAMESPACE + ']'].concat(args)); return; }
  if (level === 'warn') { if ((logger as Record<string, unknown>).warn) (logger as { warn: (...a: unknown[]) => void }).warn.apply(logger, ['[' + NAMESPACE + ']'].concat(args)); return; }
  if (_debug() && (logger as Record<string, unknown>).debug) (logger as { debug: (...a: unknown[]) => void }).debug.apply(logger, ['[' + NAMESPACE + ']'].concat(args));
};

var CONFIG = { enabled: true, maxEventLogSize: 100 };
var _eventLog: Record<string, unknown>[] = [];
var _metrics: { totalEvents: number; totalErrors: number; themeChanges: number; lastChangeAt: number | null; lastThemeId: string | null } = { totalEvents: 0, totalErrors: 0, themeChanges: 0, lastChangeAt: null, lastThemeId: null };

function hasTelemetryCore(): boolean { var tel = _resolveTelemetry(); return !!(tel && (tel as Record<string, unknown>).track); }
function addToLog(event: Record<string, unknown>): void { if (_eventLog.length >= CONFIG.maxEventLogSize) _eventLog.shift(); _eventLog.push(event); }

export var ThemeTelemetry = {
  track: function(eventName: string, data?: Record<string, unknown>): boolean {
    if (!data) data = {};
    if (!CONFIG.enabled) return false;
    var event: Record<string, unknown> = { namespace: NAMESPACE, event: eventName, timestamp: Date.now() };
    for (var k in data) { if (data.hasOwnProperty(k)) event[k] = data[k]; }
    try { addToLog(event); _metrics.totalEvents++; var tel = _resolveTelemetry(); if (tel && (tel as Record<string, unknown>).track) (tel as { track: (n: string, e: Record<string, unknown>) => void }).track(NAMESPACE + ':' + eventName, event); _log('info', eventName, event); return true; } catch (error) { _log('warn', 'Track failed:', (error as Error).message); return false; }
  },
  trackThemeChange: function(themeId: string, source: string, previousTheme?: string): boolean { _metrics.themeChanges++; _metrics.lastChangeAt = Date.now(); _metrics.lastThemeId = themeId; return this.track('change', { themeId: themeId, source: source, previousTheme: previousTheme || null, changeCount: _metrics.themeChanges }); },
  trackError: function(error: unknown, context?: Record<string, unknown>): boolean { _metrics.totalErrors++; return this.track('error', Object.assign({ error: error && (error as Error).message ? (error as Error).message : String(error) }, context || {})); },
  trackLifecycle: function(phase: string, data?: Record<string, unknown>): boolean { return this.track('lifecycle:' + phase, data || {}); },
  trackDetection: function(result: { themeId: string; source: string; detected: boolean }): boolean { return this.track('detect', { themeId: result.themeId, source: result.source, detected: result.detected }); },
  trackApply: function(result: { applied: boolean; themeId?: string; reason?: string }): boolean { return this.track('apply', { applied: result.applied, themeId: result.themeId, reason: result.reason }); },
  getEventLog: function(limit?: number): Record<string, unknown>[] { var log = _eventLog.slice().reverse(); return limit ? log.slice(0, limit) : log; },
  getRecentEvents: function(n?: number): Record<string, unknown>[] { return this.getEventLog(n || 10); },
  getTrackerStats: function(): Record<string, unknown> { return { totalEvents: _metrics.totalEvents, totalErrors: _metrics.totalErrors, themeChanges: _metrics.themeChanges, lastChangeAt: _metrics.lastChangeAt, lastThemeId: _metrics.lastThemeId, eventLogSize: _eventLog.length, telemetryCoreAvailable: hasTelemetryCore() }; },
  clearEventLog: function(): boolean { _eventLog.length = 0; return true; },
  resetMetrics: function(): boolean { _metrics.totalEvents = 0; _metrics.totalErrors = 0; _metrics.themeChanges = 0; _metrics.lastChangeAt = null; _metrics.lastThemeId = null; return true; },
  configure: function(options?: { enabled?: boolean; maxEventLogSize?: number }): Record<string, unknown> { if (!options) options = {}; if (typeof options.enabled === 'boolean') CONFIG.enabled = options.enabled; if (typeof options.maxEventLogSize === 'number') CONFIG.maxEventLogSize = options.maxEventLogSize; return Object.assign({}, CONFIG); },
  healthCheck: function(): Record<string, unknown> { var logger = _getPort('logger'); return { healthy: true, version: VERSION, moduleId: MODULE_ID, namespace: NAMESPACE, enabled: CONFIG.enabled, stats: this.getTrackerStats(), loggerAvailable: !!logger, portsInitialized: _Ports.isInitialized(), strictMode: isStrict(), issues: null as null }; }
};

export default ThemeTelemetry;
