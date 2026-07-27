// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.analytics-manager.telemetry.reporter
// PURPOSE: Telemetry reporting for analytics manager events
// ───────────────────────────────────────────────────────────────
// @contract TRACK_ANALYTICS_EVENT - trackAnalyticsEvent(eventName, data) reports analytics event
// @contract TRACK_ANALYTICS_METRIC - trackAnalyticsMetric(metricName, value, tags) reports metric
// @contract TRACK_ANALYTICS_ERROR - trackAnalyticsError(errorType, errorMessage, context) reports error
// @contract GET_EVENT_LOG - getEventLog() returns complete event log
// @contract CLEAR_EVENT_LOG - clearEventLog() clears event log
// @contract GET_RECENT_EVENTS - getRecentEvents(count) returns recent events
// @contract GET_EVENTS_BY_TYPE - getEventsByType(eventName) returns events by type
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: trackAnalyticsEvent, trackAnalyticsMetric, trackAnalyticsError,
//           getEventLog, clearEventLog, getRecentEvents, getEventsByType,
//           injectPorts, getPorts, healthCheck, info, getVersion, getMetrics,
//           resetMetrics, VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-P17WI: Migração para PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.analytics-manager.telemetry.reporter';
const COMPONENT_NAME = 'analytics-manager';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() {
  Ports.init();
}

function _getPort(name: string) {
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

type TelemetryEvent = { id: string; timestamp: number; component: string; event: string; data: Record<string, unknown> };
const eventLog: TelemetryEvent[] = [];
const maxLogSize = 500;

const _metrics: { trackCount: number; successCount: number; failCount: number; lastTrackAt: number | null } = {
  trackCount: 0,
  successCount: 0,
  failCount: 0,
  lastTrackAt: null
};

export const trackAnalyticsEvent = (eventName: string, data: Record<string, unknown> = {}) => {
  _metrics.trackCount++;
  _metrics.lastTrackAt = Date.now();

  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    component: COMPONENT_NAME,
    event: eventName,
    data
  };

  eventLog.push(event);
  if (eventLog.length > maxLogSize) {
    eventLog.shift();
  }

  const t = _getPort('telemetry');
  if (t?.track) {
    try {
      t.track(eventName, { component: COMPONENT_NAME, moduleId: MODULE_ID, ...data });
      _metrics.successCount++;
    } catch (err) {
      _metrics.failCount++;
    }
  }

  return event;
};

export const trackAnalyticsMetric = (metricName: string, value: number, tags: Record<string, unknown> = {}) =>
  trackAnalyticsEvent('analytics:metric', { metricName, value, tags, type: 'metric' });

export const trackAnalyticsError = (errorType: string, errorMessage: string, context: Record<string, unknown> = {}) =>
  trackAnalyticsEvent('analytics:error', { errorType, errorMessage, context, type: 'error' });

export const getEventLog = () => [...eventLog];

export const clearEventLog = () => {
  eventLog.length = 0;
  trackAnalyticsEvent('analytics:log:cleared');
};

export const getRecentEvents = (count = 10) => eventLog.slice(-count);

export const getEventsByType = (eventName: string) => eventLog.filter(e => e.event === eventName);

export const getVersion = () => VERSION;

export const getMetrics = () => ({ ..._metrics });

export const resetMetrics = () => {
  _metrics.trackCount = 0;
  _metrics.successCount = 0;
  _metrics.failCount = 0;
  _metrics.lastTrackAt = null;
};

export const healthCheck = () => {
  const ps = Ports.snapshot();
  const t = _getPort('telemetry');
  const telemetryAvailable = !!(t?.track);
  const successRate = _metrics.trackCount > 0 ? _metrics.successCount / _metrics.trackCount : 1;
  const bufferHealthy = eventLog.length < maxLogSize * 0.9;

  const checks = {
    telemetryAvailable,
    bufferHealthy,
    highSuccessRate: successRate > 0.8,
    hasRecentActivity: _metrics.lastTrackAt ? (Date.now() - _metrics.lastTrackAt < 300000) : true,
    portsInitialized: ps._initialized
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: {
      trackCount: _metrics.trackCount,
      successCount: _metrics.successCount,
      failCount: _metrics.failCount,
      successRate: successRate.toFixed(2),
      bufferSize: eventLog.length,
      maxBufferSize: maxLogSize
    },
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
};

export const info = () => {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    component: COMPONENT_NAME,
    telemetryAvailable: !!(_getPort('telemetry')?.track),
    bufferSize: eventLog.length,
    maxBufferSize: maxLogSize,
    metrics: getMetrics(),
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
};

export default trackAnalyticsEvent;
