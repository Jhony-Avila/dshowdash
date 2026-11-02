// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: environment-manager-telemetry
// PURPOSE: Environment Manager - Telemetry tracking
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   telemetry — exported instance of EnvironmentTelemetry
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 2.4.0-STRICT-MODE
// @changelog v2.4.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v2.3.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v2.2.2-P17 - Logger via Ports Pattern
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

export var VERSION = '2.4.0-STRICT-MODE';
export var MODULE_ID = 'environment-manager-telemetry';

export function getVersion() { return VERSION; }

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: APP_CONFIG
// ═══════════════════════════════════════════════════════════════
function _getAppConfig() {
  // 1. Try Ports first
  var portConfig = _getPort('appConfig');
  if (portConfig) return portConfig;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var waConfig = window.Core.windowAdapter.get('APP_CONFIG');
    if (waConfig) return waConfig;
  }

  // 3. In strict mode, return null (no fallback)
  if (isStrict()) return null;

  // 4. Non-strict: use window.APP_CONFIG with violation recording
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    recordViolation('WINDOW_APP_CONFIG_FALLBACK', { module: MODULE_ID });
    return window.APP_CONFIG;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Telemetry
// ═══════════════════════════════════════════════════════════════
function _getGlobalTelemetry() {
  // 1. Try Ports first
  var portTelemetry = _getPort('telemetry');
  if (portTelemetry) return portTelemetry;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var waTelemetry = window.Core.windowAdapter.get('Telemetry');
    if (waTelemetry) return waTelemetry;
  }

  // 3. In strict mode, return null (no fallback)
  if (isStrict()) return null;

  // 4. Non-strict: use window.Telemetry with violation recording
  if (typeof window !== 'undefined' && window.Telemetry) {
    recordViolation('WINDOW_TELEMETRY_FALLBACK', { module: MODULE_ID });
    return window.Telemetry;
  }

  return null;
}

var _debug = function() { var config = _getAppConfig(); return config && config.app && config.app.debug ? true : false; };
var _log = function(level: string, ...rest: any[]) {
  var logger = _getPort('logger');
  var args = Array.prototype.slice.call(arguments, 1);
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error.apply(logger, ['[EnvironmentManager:Telemetry]'].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, ['[EnvironmentManager:Telemetry]'].concat(args)); return; }
  if (_debug() && logger.debug) logger.debug.apply(logger, ['[EnvironmentManager:Telemetry]'].concat(args));
};

function EnvironmentTelemetry(this: any) {
  this._events = [];
  this._maxEvents = 100;
  this._eventCount = 0;
}

EnvironmentTelemetry.prototype.track = function(eventName: string, data: Record<string, unknown>) {
  if (!data) data = {};
  var event = { timestamp: Date.now(), event: eventName, component: 'environment-manager', moduleId: MODULE_ID, index: this._eventCount++ };
  // @ts-expect-error strict migration — TS7053
  for (var k in data) { if (data.hasOwnProperty(k)) event[k] = data[k]; }
  this._events.push(event);
  if (this._events.length > this._maxEvents) this._events.shift();
  var globalTelemetry = _getGlobalTelemetry();
  if (globalTelemetry && globalTelemetry.track) {
    try { globalTelemetry.track('env:' + eventName, { component: 'environment-manager' }); } catch (e) {}
  }
  _log('info', eventName, data);
  return event;
};

EnvironmentTelemetry.prototype.trackError = function(error: Error, context: Record<string, unknown>) {
  if (!context) context = {};
  return this.track('error', { errorMessage: error.message || String(error), errorStack: error.stack || null, context: context });
};

EnvironmentTelemetry.prototype.trackInit = function(state: Record<string, unknown>) {
  return this.track('initialized', { environment: state.environment, mode: state.mode, detectionMethod: state.detectionMethod, hostname: state.hostname, debug: state.debug, enableServiceWorker: state.enableServiceWorker });
};

EnvironmentTelemetry.prototype.trackFallback = function(reason: string) { return this.track('fallback-applied', { reason: reason }); };
EnvironmentTelemetry.prototype.trackEnvChange = function(previousEnv: unknown, newEnv: unknown, source: Record<string, unknown>) { return this.track('environment-changed', { previousEnv: previousEnv, newEnv: newEnv, source: source }); };
EnvironmentTelemetry.prototype.getEvents = function() { return this._events.slice(); };
EnvironmentTelemetry.prototype.getLastEvents = function(count: number) { if (!count) count = 10; return this._events.slice(-count); };
EnvironmentTelemetry.prototype.getEventsByType = function(eventType: string) { return this._events.filter(function(e: Record<string, unknown>) { return e.event === eventType; }); };
EnvironmentTelemetry.prototype.clear = function() { this._events = []; this._eventCount = 0; };

EnvironmentTelemetry.prototype.getSummary = function() {
  var errors = this._events.filter(function(e: Record<string, unknown>) { return e.event === 'error'; }).length;
  var fallbacks = this._events.filter(function(e: Record<string, unknown>) { return e.event === 'fallback-applied'; }).length;
  return { version: VERSION, moduleId: MODULE_ID, totalEvents: this._events.length, totalTracked: this._eventCount, errors: errors, fallbacks: fallbacks, strictMode: isStrict(), lastEvent: this._events[this._events.length - 1] || null };
};

EnvironmentTelemetry.prototype.getStats = function() { return this.getSummary(); };

// @ts-expect-error strict migration — TS7009
export var telemetry = new EnvironmentTelemetry();
export default telemetry;
