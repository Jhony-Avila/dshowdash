// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/core/emitter
// PURPOSE: Core telemetry infrastructure - Event emitter
// P18EC-REVIEWED: Core telemetry infrastructure - generic EventBus emit
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   normalizeEvent, normalizeMetric, normalizeError from ./normalizer.js
//   aggregate from ./aggregator.js
//   isEnabled, isReady, getConfig from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   emitEvent() — exported function
//   emitMetric() — exported function
//   emitError() — exported function
//   getVersion() — exported function
//   setDebug() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// WINDOW ACCESS: none (fully enterprise compliant)
// ═══════════════════════════════════════════════════════════════
// @version 5.4.0-STRICT-MODE
// @changelog v5.4.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v5.3.0-P0-ENTERPRISE - EventBus via Ports (elimina window.EventBus fallback)
// @changelog v5.2.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v5.1.0-P17WI - Logger via Ports Pattern
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { normalizeEvent, normalizeMetric, normalizeError } from './normalizer.js';
import { aggregate } from './aggregator.js';
import { isEnabled, isReady, getConfig } from '../state/store.js';

export var VERSION = '5.4.0-STRICT-MODE';
var MODULE_ID = 'telemetry-core/core/emitter';

var hasWindow = typeof window !== 'undefined';
var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

var _debugMode = false;
var _log = function(level: string, ...rest: any[]) {
  var args = Array.prototype.slice.call(arguments, 1);
  var logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; }
  if (_debugMode && logger.debug) logger.debug.apply(logger, ['[' + MODULE_ID + ']'].concat(args));
};

var _metrics = { eventEmitCount: 0, metricEmitCount: 0, errorEmitCount: 0, globalBusEmitCount: 0, globalBusErrorCount: 0, failedEmitCount: 0 };

export function emitEvent(name: string, data: Record<string, unknown>, options: Record<string, unknown>) {
  if (!data) data = {};
  if (!options) options = {};
  if (!isEnabled() || !isReady()) return null;
  try {
    _metrics.eventEmitCount++;
    var normalized = normalizeEvent(name, data, options);
    var added = aggregate(normalized as Record<string, unknown>);
    logDebug('event', normalized);
    scheduleGlobalBusEmit('telemetry:event', normalized);
    return added ? normalized : null;
  } catch (err) { _metrics.failedEmitCount++; logInternalError('emitEvent', err as Error); return null; }
}

export function emitMetric(name: string, data: Record<string, unknown>, options: Record<string, unknown>) {
  if (!data) data = {};
  if (!options) options = {};
  if (!isEnabled() || !isReady()) return null;
  try {
    _metrics.metricEmitCount++;
    var normalized = normalizeMetric(name, data, options);
    var added = aggregate(normalized as Record<string, unknown>);
    logDebug('metric', normalized);
    scheduleGlobalBusEmit('telemetry:metric', normalized);
    return added ? normalized : null;
  } catch (err) { _metrics.failedEmitCount++; logInternalError('emitMetric', err as Error); return null; }
}

export function emitError(name: string, data: Record<string, unknown>, options: Record<string, unknown>) {
  if (!data) data = {};
  if (!options) options = {};
  if (!isEnabled() || !isReady()) return null;
  try {
    _metrics.errorEmitCount++;
    var normalized = normalizeError(name, data, options);
    var added = aggregate(normalized as Record<string, unknown>);
    logDebug('error', normalized);
    scheduleGlobalBusEmit('telemetry:error', normalized);
    return added ? normalized : null;
  } catch (err) { _metrics.failedEmitCount++; logInternalError('emitError', err as Error); return null; }
}

function logDebug(type: string, event: Record<string, unknown>) { var config = getConfig(); if (!config.debug) return; _log('info', '[' + type + ']', event.event, event.data || event.metric || event.error); }

function scheduleGlobalBusEmit(eventName: string, payload: unknown) {
  var eb = _getPort('eventBus');
  if (!eb || !eb.emit) return;
  queueMicrotask(function() { try { _metrics.globalBusEmitCount++; eb.emit(eventName, payload); } catch (err) { _metrics.globalBusErrorCount++; } });
}

function logInternalError(context: string, error: Error) { _log('error', 'InternalError:' + context, error); }

export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { _debugMode = !!enabled; }
export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { _metrics.eventEmitCount = 0; _metrics.metricEmitCount = 0; _metrics.errorEmitCount = 0; _metrics.globalBusEmitCount = 0; _metrics.globalBusErrorCount = 0; _metrics.failedEmitCount = 0; }

export function healthCheck() {
  var totalEmits = _metrics.eventEmitCount + _metrics.metricEmitCount + _metrics.errorEmitCount;
  var checks = { storeReady: isReady(), telemetryEnabled: isEnabled(), lowFailRate: _metrics.failedEmitCount < totalEmits * 0.05 || totalEmits === 0, lowBusErrorRate: _metrics.globalBusErrorCount < _metrics.globalBusEmitCount * 0.1 || _metrics.globalBusEmitCount === 0 };
  var passed = 0;
  for (var k in checks) { if (checks[k as keyof typeof checks]) passed++; }
  var issues = [];
  if (!isReady()) issues.push('Store not ready');
  if (!isEnabled()) issues.push('Telemetry disabled');
  if (_metrics.failedEmitCount >= totalEmits * 0.05 && totalEmits > 0) issues.push('High emit failure rate (>5%)');
  if (_metrics.globalBusErrorCount >= _metrics.globalBusEmitCount * 0.1 && _metrics.globalBusEmitCount > 0) issues.push('High EventBus error rate (>10%)');
  var logger = _getPort('logger');
  return {
    status: passed === 4 ? 'healthy' : passed >= 3 ? 'degraded' : 'critical',
    score: passed,
    maxScore: 4,
    scoreDisplay: passed + '/4',
    checks: checks,
    issues: issues.length > 0 ? issues : null,
    loggerAvailable: !!logger,
    eventBusAvailable: !!_getPort('eventBus'),
    p0Enterprise: true,
    strictMode: isStrict(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: _Ports.isInitialized(),
    timestamp: new Date().toISOString()
  };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, metrics: Object.assign({}, _metrics), strictMode: isStrict(), healthCheck: healthCheck(), timestamp: new Date().toISOString() }; }

export default { emitEvent: emitEvent, emitMetric: emitMetric, emitError: emitError, getVersion: getVersion, setDebug: setDebug, getMetrics: getMetrics, resetMetrics: resetMetrics, healthCheck: healthCheck, info: info, injectPorts: injectPorts, getPorts: getPorts };
