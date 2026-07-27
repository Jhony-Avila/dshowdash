// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.error-boundary.telemetry.tracker
// PURPOSE: Error telemetry tracking and event logging
// ───────────────────────────────────────────────────────────────
// @contract TRACK_ERROR_EVENT - trackErrorEvent(eventName, data) tracks error event
// @contract GET_EVENT_LOG - getEventLog() returns all tracked events
// @contract CLEAR_EVENT_LOG - clearEventLog() clears event log
// @contract GET_RECENT_EVENTS - getRecentEvents(count) returns recent events
// @contract GET_METRICS - getMetrics() returns telemetry metrics
// @contract CONFIGURE - configure(options) configures tracker
// @contract RESET_METRICS - resetMetrics() resets all metrics
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: TELEMETRY_EVENTS from /core/runtime/events/index.js
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: trackErrorEvent, getEventLog, clearEventLog, getRecentEvents,
//           getMetrics, configure, resetMetrics, healthCheck, info,
//           ErrorTelemetry, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v2.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.3.0-P17WI: Ports via PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.error-boundary.telemetry.tracker';
export const NAMESPACE = 'error-boundary';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const CONFIG = {
  enabled: true,
  maxLogSize: 500,
  logToConsole: false
};

interface TelemetryEvent {
  timestampUtc: number;
  localTime: string;
  timeZone: string;
  namespace: string;
  event: string;
  data: Record<string, unknown>;
}

const _eventLog: TelemetryEvent[] = [];
const _metrics = {
  eventsTracked: 0,
  errorEvents: 0,
  lifecycleEvents: 0,
  lastEventAt: null as number | null,
  lastEventLocalTime: null as string | null
};

const _hasTelemetryCore = () => {
  const t = _getPort('telemetry') as { track?: unknown } | null;
  return t && typeof t.track === 'function';
};

const _hasEventBus = () => {
  const eb = _getPort('eventBus') as { emit?: unknown } | null;
  return eb && typeof eb.emit === 'function';
};

const _buildTimestamp = () => {
  const t = _getPort('telemetry') as { buildTimestamp?: () => { timestampUtc: number; isoUtc: string; localTime: string; timeZone: string; locale: string } } | null;
  if (t?.buildTimestamp) return t.buildTimestamp();

  const now = Date.now();
  return {
    timestampUtc: now,
    isoUtc: new Date(now).toISOString(),
    localTime: new Date(now).toLocaleString('pt-BR'),
    timeZone: 'America/Sao_Paulo',
    locale: 'pt-BR'
  };
};

export function trackErrorEvent(eventName: string, data: Record<string, unknown> = {}): boolean {
  if (!CONFIG.enabled) return false;

  const ts = _buildTimestamp();
  const event: TelemetryEvent = {
    timestampUtc: ts.timestampUtc,
    localTime: ts.localTime,
    timeZone: ts.timeZone,
    namespace: NAMESPACE,
    event: eventName,
    data
  };

  _eventLog.push(event);
  if (_eventLog.length > CONFIG.maxLogSize) _eventLog.shift();

  _metrics.eventsTracked++;
  _metrics.lastEventAt = ts.timestampUtc;
  _metrics.lastEventLocalTime = ts.localTime;

  if (eventName.includes('error') || eventName.includes('caught')) {
    _metrics.errorEvents++;
  }
  if (eventName.includes('lifecycle') || eventName.includes('init') || eventName.includes('shutdown')) {
    _metrics.lifecycleEvents++;
  }

  const tel = _getPort('telemetry') as { track?: (name: string, data: Record<string, unknown>) => void } | null;
  if (tel?.track) {
    try {
      tel.track(`${NAMESPACE}:${eventName}`, {
        component: NAMESPACE,
        timestampUtc: ts.timestampUtc,
        localTime: ts.localTime,
        ...data
      });
    } catch (e) { /* silent */ }
  }

  const eb = _getPort('eventBus') as { emit?: (event: unknown, payload: unknown) => void } | null;
  if (eb?.emit) {
    try {
      eb.emit(TELEMETRY_EVENTS.EVENT, event);
    } catch (e) { /* silent */ }
  }

  return true;
}

export function getEventLog(): TelemetryEvent[] {
  return _eventLog.slice();
}

export function clearEventLog(): boolean {
  _eventLog.length = 0;
  return true;
}

export function getRecentEvents(count: number = 10): TelemetryEvent[] {
  return _eventLog.slice(-count);
}

export function getMetrics() {
  return {
    eventsTracked: _metrics.eventsTracked,
    errorEvents: _metrics.errorEvents,
    lifecycleEvents: _metrics.lifecycleEvents,
    lastEventAt: _metrics.lastEventAt,
    lastEventLocalTime: _metrics.lastEventLocalTime,
    eventLogSize: _eventLog.length,
    telemetryCoreAvailable: _hasTelemetryCore(),
    eventBusAvailable: _hasEventBus()
  };
}

export function configure(options: { enabled?: boolean; maxLogSize?: number; logToConsole?: boolean } = {}) {
  if (typeof options.enabled === 'boolean') CONFIG.enabled = options.enabled;
  if (typeof options.maxLogSize === 'number') CONFIG.maxLogSize = options.maxLogSize;
  if (typeof options.logToConsole === 'boolean') CONFIG.logToConsole = options.logToConsole;
  return { ...CONFIG };
}

export function resetMetrics(): boolean {
  _metrics.eventsTracked = 0;
  _metrics.errorEvents = 0;
  _metrics.lifecycleEvents = 0;
  _metrics.lastEventAt = null;
  _metrics.lastEventLocalTime = null;
  return true;
}

export function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const ts = _buildTimestamp();
  const m = getMetrics();
  const t = _getPort('telemetry') as { buildTimestamp?: unknown } | null;
  const buildTimestampAvailable = t && typeof t.buildTimestamp === 'function';

  const checks = {
    enabled: CONFIG.enabled,
    bufferNotOverflowing: _eventLog.length < CONFIG.maxLogSize,
    telemetryCoreAvailable: m.telemetryCoreAvailable,
    eventBusAvailable: m.eventBusAvailable,
    buildTimestampAvailable,
    portsInitialized: portsSnapshot._initialized
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const issues = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

  return {
    status: passed >= 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    issues: issues.length > 0 ? issues : null,
    portsInitialized: portsSnapshot._initialized,
    metrics: m,
    version: VERSION,
    moduleId: MODULE_ID,
    timestampUtc: ts.timestampUtc,
    localTime: ts.localTime,
    timeZone: ts.timeZone
  };
}

export function info() {
  const portsSnapshot = Ports.snapshot();
  const ts = _buildTimestamp();

  return {
    moduleId: MODULE_ID,
    version: VERSION,
    namespace: NAMESPACE,
    portsInitialized: portsSnapshot._initialized,
    config: { ...CONFIG },
    metrics: getMetrics(),
    healthCheck: healthCheck(),
    timestampUtc: ts.timestampUtc,
    localTime: ts.localTime,
    timeZone: ts.timeZone
  };
}

export const ErrorTelemetry = {
  trackErrorEvent,
  getEventLog,
  clearEventLog,
  getRecentEvents,
  getMetrics,
  configure,
  resetMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};

export default trackErrorEvent;
