// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accessibility-manager.telemetry.tracker
// PURPOSE: Telemetry tracking for accessibility events
// ───────────────────────────────────────────────────────────────
// @contract TRACK - track(event, data) tracks an accessibility event
// @contract TRACK_EVENT - trackEvent(event, data) alias for track
// @contract TRACK_ERROR - trackError(event, error) tracks an error event
// @contract GET_METRICS - getMetrics() returns telemetry metrics
// @contract GET_STATS - getStats() alias for getMetrics
// @contract GET_EVENTS - getEvents() returns event log
// @contract RESET_METRICS - resetMetrics() resets all metrics
// @contract INIT - init(ctx) initializes the tracker with context
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: TELEMETRY_INTENTS from /core/runtime/events/index.js
// PROVIDES: track, trackEvent, trackError, getMetrics, getStats, getEvents,
//           resetMetrics, init, injectPorts, getPorts, healthCheck, info, getVersion, VERSION, MODULE_ID
// @changelog v2.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.3.0-P18EC: Migrated TELEMETRY_EVENTS.TRACK to TELEMETRY_INTENTS.TRACK
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';

export const VERSION = '2.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accessibility-manager.telemetry.tracker';

const Ports = createCorePorts({ moduleId: MODULE_ID });

export function injectPorts(p: unknown) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

const _metrics: { events: number; a11yChanges: number; errors: number; lastEventAt: number | null } = {
  events: 0,
  a11yChanges: 0,
  errors: 0,
  lastEventAt: null
};

const _eventLog: Array<{ event: string; data: unknown; timestamp: number }> = [];
const MAX_LOG_SIZE = 100;

function _addToLog(event: string, data: unknown) {
  _eventLog.push({
    event,
    data,
    timestamp: Date.now()
  });
  if (_eventLog.length > MAX_LOG_SIZE) {
    _eventLog.shift();
  }
}

export function track(event: string, data: unknown = {}) {
  _metrics.events++;
  _metrics.lastEventAt = Date.now();

  if (event.indexOf('error') > -1) {
    _metrics.errors++;
  }
  if (event.indexOf('change') > -1) {
    _metrics.a11yChanges++;
  }

  _addToLog(event, data);

  const eb = Ports.get('eventBus');
  if (eb && eb.emit) {
    eb.emit(TELEMETRY_INTENTS.TRACK, {
      source: MODULE_ID,
      event,
      data,
      timestamp: Date.now()
    });
  }
}

export function trackEvent(event: string, data: unknown) {
  track(event, data);
}

export function trackError(event: string, error: unknown) {
  track(event, { error: (error instanceof Error) ? error.message : 'unknown' });
}

export function getMetrics() {
  return { ..._metrics };
}

export function getStats() {
  return getMetrics();
}

export function getEvents() {
  return [..._eventLog];
}

export function resetMetrics() {
  _metrics.events = 0;
  _metrics.a11yChanges = 0;
  _metrics.errors = 0;
  _metrics.lastEventAt = null;
  _eventLog.length = 0;
}

export function init(ctx: { ports?: unknown } | undefined) {
  Ports.init();
  if (ctx && ctx.ports) {
    Ports.inject(ctx.ports);
  }
  return { ok: true, version: VERSION };
}

export function getVersion() {
  return VERSION;
}

export function healthCheck() {
  const checks = {
    hasMetrics: !!_metrics,
    lowErrorRate: _metrics.events === 0 || (_metrics.errors / _metrics.events) < 0.2,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    eventLogSize: _eventLog.length,
    p18IntentsAvailable: true,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics(),
    eventLogSize: _eventLog.length,
    usingP18Intents: true,
    timestamp: Date.now()
  };
}

export default {
  track,
  trackEvent,
  trackError,
  getMetrics,
  getStats,
  getEvents,
  resetMetrics,
  init,
  healthCheck,
  info,
  getVersion,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
