// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P27-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16:port:telemetry
// PURPOSE: P27-GOVERNED: Dynamic telemetry events use TELEMETRY_EVENTS.EVENT token with name payload
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   TELEMETRY_EVENTS from /core/runtime/events/catalog/telemetry.events.js
//
// PROVIDES:
//   VERSION — module constant
//   TelemetryPort — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TELEMETRY_EVENTS.EVENT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createTelemetryPorts } from '/core/runtime/ports-profiles.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-16:port:telemetry';
const PANEL_ID = 'panel-16';
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
let _telemetry: Record<string, unknown> | null = null;
let _context: { panelId: string; version: string | null; correlationId: string | null; runId: string | null; sessionId: string | null } = { panelId: PANEL_ID, version: null, correlationId: null, runId: null, sessionId: null };
function generateId(prefix: string) { prefix = prefix || 'id'; return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`; }
export const TelemetryPort = {
  inject(telemetry: Record<string, unknown>) { _telemetry = telemetry; },
  injectPorts(p: Record<string, unknown>) { return Ports.inject(p); },
  getPorts() { return Ports.snapshot(); },
  setContext(ctx: Record<string, unknown>) { _context = Object.assign({}, _context, ctx); },
  _get() { if (_telemetry) return _telemetry; _initPorts(); return _getPort('telemetryCore') || _getPort('telemetryTracker'); },
  initSession(version: string) { _context.version = version; _context.correlationId = generateId('corr'); _context.runId = generateId('run'); _context.sessionId = generateId('sess'); this.track(LIFECYCLE_EVENTS.INITIALIZED, { version, correlationId: _context.correlationId }); return Object.assign({}, _context); },
  // P27: Use TELEMETRY_EVENTS.EVENT token with name in payload (not concatenated event names)
  track(event: string, data: Record<string, unknown>, options?: Record<string, unknown>) {
    data = data || {};
    options = options || {};
    _initPorts();
    const telemetry = this._get();
    const enrichedData = Object.assign({}, data, {
      panelId: _context.panelId,
      version: _context.version,
      correlationId: _context.correlationId,
      runId: _context.runId,
      sessionId: _context.sessionId,
      timestamp: Date.now()
    });
    // P27: Telemetry core uses its own namespace internally
    if (telemetry && telemetry.track) return telemetry.track(`${PANEL_ID}:${event}`, enrichedData, options);
    if (telemetry && telemetry.event) return telemetry.event(`${PANEL_ID}:${event}`, enrichedData, options);
    // P27: EventBus fallback uses fixed token TELEMETRY_EVENTS.EVENT with name in payload
    const eb = _getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(TELEMETRY_EVENTS.EVENT, {
        name: `${PANEL_ID}:${event}`,
        source: MODULE_ID,
        data: enrichedData
      });
    }
    return enrichedData;
  },
  info(message: string, data?: Record<string, unknown>) { const t = this._get(); if (t && t.info) return t.info(PANEL_ID, message, Object.assign({}, data || {}, _context)); return this.track('info', Object.assign({ message }, data || {})); },
  warn(message: string, data?: Record<string, unknown>) { const t = this._get(); if (t && t.warn) return t.warn(PANEL_ID, message, Object.assign({}, data || {}, _context)); return this.track('warn', Object.assign({ message }, data || {})); },
  error(message: string, error?: unknown, data?: Record<string, unknown>) { data = data || {}; const err = error as Record<string, unknown>; const errorData = Object.assign({ message, error: err && err.message ? err.message : error, stack: err && err.stack ? err.stack : null }, data, _context); const t = this._get(); if (t && t.trackError) return t.trackError(PANEL_ID, error || message, data); if (t && t.error) return t.error(`${PANEL_ID}:error`, errorData); return this.track(LIFECYCLE_EVENTS.ERROR, errorData); },
  metric(name: string, value: number, data?: Record<string, unknown>) { const t = this._get(); const metricData = Object.assign({ name, value }, data || {}, _context); if (t && t.metric) return t.metric(`${PANEL_ID}:${name}`, metricData); return this.track(`metric:${name}`, metricData); },
  timing(operation: string, durationMs: number, success?: boolean) { success = success !== false; const t = this._get(); if (t && t.trackTiming) return t.trackTiming(`${PANEL_ID}:${operation}`, durationMs, success); return this.metric(operation, durationMs, { success, unit: 'ms' }); },
  // P22: Renamed to trackMountPerformance to avoid dual-emit with EventBus MOUNTED
  trackMountPerformance(mountTime: number) { return this.track('mount:performance', { mountTime, unit: 'ms' }); },
  // P22: Renamed to trackUnmountComplete to avoid dual-emit with EventBus UNMOUNTED
  trackUnmountComplete() { return this.track('unmount:complete', {}); },
  // Deprecated aliases for backward compatibility - will log warning
  trackMount(mountTime: number) { this.warn('trackMount is deprecated, use trackMountPerformance'); return this.trackMountPerformance(mountTime); },
  trackUnmount() { this.warn('trackUnmount is deprecated, use trackUnmountComplete'); return this.trackUnmountComplete(); },
  trackStateChange(from: string, to: string) { return this.track('state:change', { from, to }); },
  trackDataLoad(loadCount: number, duration: number) { return this.track(LIFECYCLE_EVENTS.DATA_LOADED, { loadCount, duration, unit: 'ms' }); },
  trackError(context: string, error: unknown) { return this.error(`${context} failed`, error, { context }); },
  getContext() { return Object.assign({}, _context); },
  isConnected() { return !!this._get(); },
  isAvailable() { return this.isConnected(); },
  reset() { _telemetry = null; _context = { panelId: PANEL_ID, version: null, correlationId: null, runId: null, sessionId: null }; },
  getInfo() { const ps = Ports.snapshot(); const t = this._get(); return { moduleId: MODULE_ID, version: VERSION, injected: !!_telemetry, connected: this.isConnected(), context: this.getContext(), portsInitialized: ps._initialized, globalTelemetryVersion: t && (t.version || (t.getVersion ? t.getVersion() : 'unknown')) || 'unknown', p22Compliant: true, p27Governed: true }; }
};
export default TelemetryPort;
