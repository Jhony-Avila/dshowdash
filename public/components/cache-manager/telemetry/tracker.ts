// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cache-manager.telemetry.tracker
// PURPOSE: Cache telemetry tracking and event logging
// ───────────────────────────────────────────────────────────────
// @contract EVENT_TRACKING - trackCacheEvent() for all cache events
// @contract EVENT_LOG - getEventLog(), getRecentEvents(), clearEventLog()
// @contract SCHEMA_VALIDATION - validate event data against schema
// @contract PORTS - Integration via PortsFactory/PortsProfiles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_EVENTS, TELEMETRY_SCHEMA from ../core/contracts.js
// PROVIDES: trackCacheEvent(), getEventLog(), clearEventLog(),
//   getRecentEvents(), getEventsByType(), getTrackerStats(),
//   healthCheck(), info(), injectPorts(), getPorts()
// @changelog v3.7.1-STRICT-MODE: Strict mode integration in healthCheck/info
// @changelog v3.7.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.6.0-ENTERPRISE: ES6 modernization
// @changelog v3.5.0-P22: Removed dual-emit: EventBus emission removed
// @changelog v3.4.0-P18EC: Migrated to TELEMETRY_EVENTS constants
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { TELEMETRY_EVENTS, TELEMETRY_SCHEMA } from '../core/contracts.js';

export const VERSION = '3.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cache-manager.telemetry.tracker';
export const COMPONENT_NAME = 'cache-manager';

type LoggerPort = { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void };
type TelemetryPort = { track?: (name: string, data: Record<string, unknown>) => void };

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let eventLog: Record<string, unknown>[] = [];
const maxLogSize = 500;
let eventCount = 0;
let _debug = false;
let _metrics: { totalEvents: number; eventsByType: Record<string, number>; schemaValidations: number; schemaViolations: number; telemetryCoreForwards: number; lastEventAt: number | null } = { totalEvents: 0, eventsByType: {}, schemaValidations: 0, schemaViolations: 0, telemetryCoreForwards: 0, lastEventAt: null };

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger') as LoggerPort | null;
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}]`, ...args); return; }
  if (_debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};

const validateEventData = (eventName: string, data: Record<string, unknown>) => {
  const requiredFields = (TELEMETRY_SCHEMA as Record<string, string[]>)[eventName];
  if (!requiredFields) return { valid: true };
  _metrics.schemaValidations++;
  const missing = requiredFields.filter((field: string) => data[field] === undefined);
  if (missing.length > 0) {
    _metrics.schemaViolations++;
    return { valid: false, missing };
  }
  return { valid: true };
};

export const setDebug = (debug: boolean) => { _debug = debug; };
export const getVersion = () => VERSION;

export const trackCacheEvent = (eventName: string, data?: Record<string, unknown>) => {
  if (!data) data = {};
  const event: Record<string, unknown> = { timestamp: Date.now(), component: COMPONENT_NAME, event: eventName, data: { ...data, moduleId: data.moduleId || MODULE_ID }, index: eventCount++ };
  const validation = validateEventData(eventName, data);
  if (!validation.valid) {
    // @ts-expect-error strict migration — TS18048
    event.schemaWarning = `Missing fields: ${validation.missing.join(', ')}`;
    _log('warn', 'Schema validation failed for', eventName, validation.missing);
  }
  eventLog.push(event);
  if (eventLog.length > maxLogSize) eventLog.shift();
  _metrics.totalEvents++;
  (_metrics.eventsByType as Record<string, number>)[eventName] = ((_metrics.eventsByType as Record<string, number>)[eventName] || 0) + 1;
  _metrics.lastEventAt = Date.now();
  // P22: Telemetry Core only - NO EventBus emission (removed dual-emit)
  const tel = _getPort('telemetry') as TelemetryPort | null;
  if (tel?.track) {
    try { tel.track(eventName, { component: COMPONENT_NAME, ...data }); _metrics.telemetryCoreForwards++; } catch (e) {}
  }
  return event;
};

export const getEventLog = () => eventLog.slice();
export const clearEventLog = () => { eventLog.length = 0; eventCount = 0; _log('info', 'Event log cleared'); };
export const getRecentEvents = (count = 10) => eventLog.slice(-count);
export const getEventsByType = (eventType: string) => eventLog.filter((e) => e['event'] === eventType);
export const getTrackerStats = () => ({ version: VERSION, moduleId: MODULE_ID, eventsCount: eventLog.length, totalTracked: eventCount, maxSize: maxLogSize, eventCounts: { ..._metrics.eventsByType }, schemaStats: { validations: _metrics.schemaValidations, violations: _metrics.schemaViolations } });

export const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const tel = _getPort('telemetry') as TelemetryPort | null;
  const logger = _getPort('logger') as LoggerPort | null;
  const checks = { logInitialized: Array.isArray(eventLog), logNotOverflowing: eventLog.length < maxLogSize, lowSchemaViolations: _metrics.schemaViolations < 20, telemetryCoreAvailable: !!(tel?.track), loggerReady: !!logger, portsInitialized: portsSnapshot._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
};

export const info = () => {
  const portsSnapshot = Ports.snapshot();
  const tel = _getPort('telemetry') as TelemetryPort | null;
  const logger = _getPort('logger') as LoggerPort | null;
  return { version: VERSION, moduleId: MODULE_ID, debug: _debug, eventLogSize: eventLog.length, maxLogSize, metrics: { ..._metrics }, availableEvents: Object.keys(TELEMETRY_EVENTS).length, schemasConfigured: Object.keys(TELEMETRY_SCHEMA).length, healthCheck: healthCheck(), integrations: { telemetryCoreAvailable: !!(tel?.track), loggerReady: !!logger }, portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
};

export const resetMetrics = () => { _metrics = { totalEvents: 0, eventsByType: {} as Record<string, number>, schemaValidations: 0, schemaViolations: 0, telemetryCoreForwards: 0, lastEventAt: null as number | null }; _log('info', 'Metrics reset'); };

export default { trackCacheEvent, getEventLog, clearEventLog, getRecentEvents, getEventsByType, getTrackerStats, getVersion, setDebug, healthCheck, info, resetMetrics, injectPorts, getPorts, VERSION, MODULE_ID };
