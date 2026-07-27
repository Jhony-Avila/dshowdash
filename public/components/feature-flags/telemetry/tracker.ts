// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.telemetry.tracker
// PURPOSE: Telemetry tracking for feature flags events
// ───────────────────────────────────────────────────────────────
// @contract TRACK - track(event, data) tracks telemetry event
// @contract TRACK_FLAG_EVENT - trackFlagEvent(event, data) alias for track
// @contract GET_METRICS - getMetrics() returns tracker metrics
// @contract RESET_METRICS - resetMetrics() resets all metrics
// @contract GET_EVENT_LOG - getEventLog() returns event log (stub)
// @contract GET_RECENT_EVENTS - getRecentEvents() returns recent events (stub)
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createUiPorts from /core/runtime/ports-profiles.js
// IMPORTS: TELEMETRY_EVENTS, TELEMETRY_INTENTS from /core/runtime/events/catalog/telemetry.events.js
// PROVIDES: track, trackFlagEvent, getMetrics, resetMetrics, getEventLog,
//           getRecentEvents, injectPorts, getPorts, healthCheck, info,
//           VERSION, MODULE_ID
// @changelog v2.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.4.0-P18EC: Migrated TELEMETRY_EVENTS.TRACK to TELEMETRY_INTENTS.TRACK
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_EVENTS, TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';

export const VERSION = '2.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.feature-flags.telemetry.tracker';

const Ports = createUiPorts({ moduleId: MODULE_ID });

const _initPorts = (): unknown => Ports.init();
const _getPort = (name: string) => Ports.get(name);

export function injectPorts(p: Record<string, unknown>): unknown {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

const _metrics: {
  events: number;
  evaluations: number;
  errors: number;
  lastEventAt: number | null;
} = {
  events: 0,
  evaluations: 0,
  errors: 0,
  lastEventAt: null
};

export function track(event: string, data: Record<string, unknown> = {}): void {
  _metrics.events++;
  _metrics.lastEventAt = Date.now();

  if (event.includes('error')) _metrics.errors++;
  if (event.includes('eval')) _metrics.evaluations++;

  const eventBus = _getPort('eventBus');
  if (eventBus?.emit) {
    eventBus.emit(TELEMETRY_INTENTS.TRACK, {
      source: MODULE_ID,
      event,
      data,
      timestamp: Date.now()
    });
  }
}

export const trackFlagEvent = track;

export function getMetrics() {
  return { ..._metrics };
}

export function resetMetrics() {
  _metrics.events = 0;
  _metrics.evaluations = 0;
  _metrics.errors = 0;
  _metrics.lastEventAt = null;
}

export function getEventLog(): Record<string, unknown>[] {
  return [];
}

export function getRecentEvents(): Record<string, unknown>[] {
  return [];
}

export function healthCheck() {
  const portsSnapshot = Ports.snapshot();

  const checks = {
    hasMetrics: true,
    lowErrorRate: _metrics.events === 0 || (_metrics.errors / _metrics.events) < 0.2,
    portsInitialized: portsSnapshot._initialized
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
    portsInitialized: portsSnapshot._initialized,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now(),
    p18IntentsAvailable: true
  };
}

export function info() {
  const portsSnapshot = Ports.snapshot();

  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    portsInitialized: portsSnapshot._initialized,
    healthCheck: healthCheck(),
    timestamp: Date.now(),
    usingP18Intents: true
  };
}

export default {
  track,
  trackFlagEvent,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  getEventLog,
  getRecentEvents,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
