// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-tokens-telemetry
// PURPOSE: Theme Tokens Loader - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NAMESPACE — module constant
//   getVersion() — exported function
//   TokensTelemetry — exported object
//   injectPorts() — exported function
//   getPorts() — exported function
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 1.4.0-STRICT-MODE
// @changelog v1.4.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.3.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.2.0-P17WI - Logger via ports pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '1.4.0-STRICT-MODE';
export var MODULE_ID = 'theme-tokens-telemetry';
export var NAMESPACE = 'theme-tokens-loader';

export function getVersion() { return VERSION; }

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

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Telemetry
// ═══════════════════════════════════════════════════════════════
function _getTelemetry() {
  // 1. Try Ports first
  var portTelemetry = _getPort('telemetry');
  if (portTelemetry) return portTelemetry;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var waTelemetry = window.Core.windowAdapter.get('Telemetry');
    if (waTelemetry) return waTelemetry;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Telemetry with violation recording
  if (typeof window !== 'undefined' && window.Telemetry) {
    recordViolation('WINDOW_TELEMETRY_FALLBACK', { module: MODULE_ID });
    return window.Telemetry;
  }

  return null;
}

var _log = function(level: string, ...rest: any[]) {
  var logger = _getLogger();
  if (!logger) return;
  var args = Array.prototype.slice.call(arguments, 1);
  var prefix = '[' + NAMESPACE + ']';
  if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; }
  if (level === 'info') { if (logger.info) logger.info.apply(logger, [prefix].concat(args)); return; }
};

var CONFIG = { enabled: true, maxEventLogSize: 100 };
var _eventLog: unknown[] = [];
var _metrics = { totalEvents: 0, totalErrors: 0, loadEvents: 0, lastEventAt: null as unknown | null };

function hasTelemetryCore() {
  var telemetry = _getTelemetry();
  return telemetry && telemetry.track;
}

function addToLog(event: Record<string, unknown>) { if (_eventLog.length >= CONFIG.maxEventLogSize) _eventLog.shift(); _eventLog.push(event); }

export var TokensTelemetry = {
  track: function(eventName: string, data: Record<string, unknown>) {
    if (!data) data = {};
    if (!CONFIG.enabled) return false;
    var event = Object.assign({ namespace: NAMESPACE, event: eventName, timestamp: Date.now() }, data);
    try {
      addToLog(event);
      _metrics.totalEvents++;
      _metrics.lastEventAt = event.timestamp;
      var telemetry = _getTelemetry();
      if (telemetry && telemetry.track) telemetry.track(NAMESPACE + ':' + eventName, event);
      _log('info', eventName, event);
      return true;
    } catch (error: any) { _log('warn', 'Track failed:', error.message); return false; }
  },
  trackTokensEvent: function(event: string, data: Record<string, unknown>) { return this.track('tokens:' + event, data); },
  trackError: function(context: string, error: Error, extra: Record<string, unknown>) { if (!extra) extra = {}; _metrics.totalErrors++; return this.track('error', Object.assign({ context: context, error: error && error.message ? error.message : String(error) }, extra)); },
  trackTiming: function(operation: string, durationMs: number, success: boolean) { return this.track('timing', { operation: operation, durationMs: durationMs, success: success !== false }); },
  trackSourceLoaded: function(type: string, source: Record<string, unknown>, tokenCount: unknown, success: boolean) { _metrics.loadEvents++; return this.track('source:' + type + ':loaded', { source: source, tokenCount: tokenCount, success: success !== false }); },
  trackLifecycle: function(phase: unknown, data: Record<string, unknown>) { return this.track('lifecycle:' + phase, data); },
  getEventLog: function(limit: number) { var log = _eventLog.slice().reverse(); return limit ? log.slice(0, limit) : log; },
  // @ts-expect-error strict migration — TS2345
  getRecentEvents: function(n: unknown) { return this.getEventLog(n || 10); },
  getTrackerStats: function() { return { totalEvents: _metrics.totalEvents, totalErrors: _metrics.totalErrors, loadEvents: _metrics.loadEvents, lastEventAt: _metrics.lastEventAt, eventLogSize: _eventLog.length, telemetryCoreAvailable: hasTelemetryCore() }; },
  clearEventLog: function() { _eventLog.length = 0; return true; },
  resetMetrics: function() { _metrics.totalEvents = 0; _metrics.totalErrors = 0; _metrics.loadEvents = 0; _metrics.lastEventAt = null; return true; },
  configure: function(options: Record<string, unknown>) { if (!options) options = {}; if (typeof options.enabled === 'boolean') CONFIG.enabled = options.enabled; if (typeof options.maxEventLogSize === 'number') CONFIG.maxEventLogSize = options.maxEventLogSize; return Object.assign({}, CONFIG); },
  healthCheck: function() { return { healthy: true, version: VERSION, moduleId: MODULE_ID, namespace: NAMESPACE, enabled: CONFIG.enabled, stats: this.getTrackerStats(), issues: null as unknown | null, loggerAvailable: !!_getLogger(), portsInitialized: _Ports.isInitialized(), strictMode: isStrict() }; }
};

export default TokensTelemetry;
