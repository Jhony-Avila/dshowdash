// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10.telemetry.tracker
// PURPOSE: Panel-10 Telemetry Tracker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   PanelTelemetryTracker() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   entry.event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

const MODULE_ID = 'panel-10.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';
const NAMESPACE = 'panel';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

function PanelTelemetryTracker(this: any, panelId: string, config: Record<string, unknown> = {}) { this.panelId = panelId; this.config = { debug: false, bufferSize: 100, ...config }; this.initialized = false; this._buffer = []; this._telemetry = null; this._metrics = { eventsTracked: 0, errorsTracked: 0, loadsTracked: 0, startedAt: Date.now() }; _initPorts(); }

PanelTelemetryTracker.prototype.init = function() { if (this.initialized) return this; try { const t = _getPort('telemetry'); if (t?.isReady?.()) this._telemetry = t; } catch (e) {} this.initialized = true; return this; };

PanelTelemetryTracker.prototype.track = function(event: string, data: Record<string, unknown> = {}) { if (!this.initialized) this.init(); const entry = { event: `${NAMESPACE}:${this.panelId}:${event}`, data: { panelId: this.panelId, ...data }, timestamp: Date.now() }; this._metrics.eventsTracked++; if (this._telemetry?.event) this._telemetry.event(entry.event, entry.data, { component: `${NAMESPACE}-${this.panelId}` }); else { this._addToBuffer(entry); this._emitEvent(entry); } };

PanelTelemetryTracker.prototype.trackLoad = function(duration: number, success: boolean, dataSize: number) { this._metrics.loadsTracked++; const data = { panelId: this.panelId, duration, success: success !== false, dataSize: dataSize || 0, unit: 'ms' }; if (this._telemetry?.metric) this._telemetry.metric(`${NAMESPACE}:${this.panelId}:load`, data, { component: `${NAMESPACE}-${this.panelId}` }); else this.track(LIFECYCLE_EVENTS.DATA_LOADED, data); };

PanelTelemetryTracker.prototype.trackError = function(error: Error | unknown, context: string) { this._metrics.errorsTracked++; const err = error as { message?: string; stack?: string; code?: string }; const data = { panelId: this.panelId, context: context || '', message: err?.message || String(error), stack: err?.stack || null, code: err?.code || null }; if (this._telemetry?.error) this._telemetry.error(`${NAMESPACE}:${this.panelId}:error`, data, { component: `${NAMESPACE}-${this.panelId}` }); else this.track(LIFECYCLE_EVENTS.ERROR, data); };

PanelTelemetryTracker.prototype.trackRefresh = function(source: string, success: boolean, duration: number) { this.track(LIFECYCLE_EVENTS.REFRESH, { source, success: success !== false, duration: duration || 0 }); };
PanelTelemetryTracker.prototype.trackMetricAlert = function(metric: string, value: number, threshold: number, severity: string) { this.track('metric:alert', { metric, value, threshold, severity: severity || 'warning' }); };
PanelTelemetryTracker.prototype.trackInteraction = function(action: string, detail: Record<string, unknown> = {}) { this.track(LIFECYCLE_EVENTS.INTERACTION, { action, ...detail }); };
PanelTelemetryTracker.prototype.trackLifecycle = function(event: string, data: Record<string, unknown> = {}) { this.track(`lifecycle:${event}`, data); };
PanelTelemetryTracker.prototype._addToBuffer = function(entry: Record<string, unknown>) { this._buffer.push(entry); if (this._buffer.length > this.config.bufferSize) this._buffer.shift(); };
PanelTelemetryTracker.prototype._emitEvent = (entry: { event: string; data: Record<string, unknown> }) => { try { const eb = _getPort('eventBus'); if (eb?.emit) eb.emit(entry.event, entry.data); } catch (e) {} };
PanelTelemetryTracker.prototype.getBuffer = function() { return this._buffer.slice(); };
PanelTelemetryTracker.prototype.clearBuffer = function() { this._buffer = []; };
PanelTelemetryTracker.prototype.getMetrics = function() { return { ...this._metrics, bufferSize: this._buffer.length, uptimeMs: Date.now() - this._metrics.startedAt, hasTelemetryCore: !!this._telemetry }; };
PanelTelemetryTracker.prototype.healthCheck = function() { return { status: 'healthy', initialized: this.initialized, metrics: this.getMetrics(), version: VERSION, moduleId: MODULE_ID }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export { PanelTelemetryTracker, VERSION, MODULE_ID };
export default PanelTelemetryTracker;
