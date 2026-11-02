// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: fonts-manager-tracker
// PURPOSE: Fonts Manager - Telemetry Tracker v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   trackEvent() — exported function
//   trackLifecycle() — exported function
//   trackSourcesLoaded() — exported function
//   trackFontLoad() — exported function
//   trackError() — exported function
//   trackTypographyGenerated() — exported function
//   getEvents() — exported function
//   getMetrics() — exported function
//   getStats() — exported function
//   clear() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.TelemetryCore
// ═══════════════════════════════════════════════════════════════
'use strict';

export var MODULE_ID = 'fonts-manager-tracker';
export var VERSION = '8.1.0-ENTERPRISE';

var NAMESPACE = 'fonts-manager';
var MAX_EVENTS = 100;

var events: unknown[] = [];
var metrics = { totalEvents: 0, lifecycleEvents: 0, loadEvents: 0, errorEvents: 0, lastEventAt: null as unknown | null };

function getTelemetryCore() {
  if (typeof window !== 'undefined' && window.TelemetryCore) return window.TelemetryCore;
  return null;
}

function logEvent(type: string, data: Record<string, unknown>) {
  data = data || {};
  var event = { id: NAMESPACE + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), namespace: NAMESPACE, type: type, data: data, timestamp: Date.now() };
  events.push(event);
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
  metrics.totalEvents++; metrics.lastEventAt = event.timestamp;
  return event;
}

export function trackEvent(type: string, data: Record<string, unknown>) {
  var event = logEvent(type, data);
  var TC = getTelemetryCore();
  if (TC && TC.track) { try { TC.track(NAMESPACE + ':' + type, data); } catch (e) {} }
  return event;
}

export function trackLifecycle(action: string, data: Record<string, unknown>) { metrics.lifecycleEvents++; return trackEvent('lifecycle:' + action, data); }
export function trackSourcesLoaded(result: Record<string, unknown>) { metrics.loadEvents++; return trackEvent('sources:loaded', { loaded: result.loaded, failed: result.failed, loadTime: result.loadTime, total: (result.loaded as number) + (result.failed as number) }); }
export function trackFontLoad(sourceId: unknown, success: boolean, data: Record<string, unknown>) { metrics.loadEvents++; return trackEvent(success ? 'font:loaded' : 'font:failed', { sourceId: sourceId, data: data }); }
export function trackError(type: string, error: Error) { metrics.errorEvents++; return trackEvent('error:' + type, { message: error ? (error.message || String(error)) : 'Unknown', stack: error && error.stack ? error.stack.slice(0, 200) : undefined }); }
export function trackTypographyGenerated(variantsCount: unknown) { return trackEvent('typography:generated', { variantsCount: variantsCount }); }

export function getEvents(limit?: number) { limit = limit || 50; return events.slice(-limit); }
export function getMetrics() { return { totalEvents: metrics.totalEvents, lifecycleEvents: metrics.lifecycleEvents, loadEvents: metrics.loadEvents, errorEvents: metrics.errorEvents, lastEventAt: metrics.lastEventAt }; }
export function getStats() { return { totalEvents: metrics.totalEvents, lifecycleEvents: metrics.lifecycleEvents, loadEvents: metrics.loadEvents, errorEvents: metrics.errorEvents, lastEventAt: metrics.lastEventAt, bufferSize: events.length, telemetryCoreAvailable: !!getTelemetryCore() }; }
export function clear() { events = []; metrics = { totalEvents: 0, lifecycleEvents: 0, loadEvents: 0, errorEvents: 0, lastEventAt: null }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, eventsCount: events.length }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, trackEvent: trackEvent, trackLifecycle: trackLifecycle, trackSourcesLoaded: trackSourcesLoaded, trackFontLoad: trackFontLoad, trackError: trackError, trackTypographyGenerated: trackTypographyGenerated, getEvents: getEvents, getMetrics: getMetrics, getStats: getStats, clear: clear, info: info, healthCheck: healthCheck };
