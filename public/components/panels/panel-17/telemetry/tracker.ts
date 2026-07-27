// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-17.telemetry.tracker
// PURPOSE: Panel-17 - Telemetry Tracker Enterprise
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
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

const MODULE_ID = 'panel-17.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

function PanelTelemetryTracker(this: any, panelId: string, version: string) { this.panelId = panelId; this.version = version; this.initialized = false; this.telemetryCore = null; this.metrics = { loadCount: 0, errorCount: 0, totalLoadTime: 0, interactions: 0, lastActivity: null }; this.sessionStart = Date.now(); _initPorts(); }

PanelTelemetryTracker.prototype.init = function() { if (this.initialized) return; try { const telemetry = _getPort('telemetry'); if (telemetry) { this.telemetryCore = telemetry; if (this.telemetryCore.register) this.telemetryCore.register({ namespace: `panel:${this.panelId}`, version: this.version, flushIntervalMs: 30000 }); } this.initialized = true; } catch (e) {} };

PanelTelemetryTracker.prototype.track = function(event: string, data: Record<string, unknown> = {}) { if (!this.initialized) this.init(); const payload = { event: `panel.${this.panelId}.${event}`, panelId: this.panelId, version: this.version, timestamp: Date.now(), sessionDuration: Date.now() - this.sessionStart, source: MODULE_ID, ...data }; this.metrics.lastActivity = Date.now(); if (this.telemetryCore?.track) this.telemetryCore.track(payload.event, payload); return payload; };

PanelTelemetryTracker.prototype.trackLoad = function(duration: number, success: boolean, itemCount = 0) { this.metrics.loadCount++; this.metrics.totalLoadTime += duration; if (!success) this.metrics.errorCount++; return this.track(LIFECYCLE_EVENTS.DATA_LOADED, { duration, success, itemCount, avgLoadTime: this.metrics.totalLoadTime / this.metrics.loadCount }); };
PanelTelemetryTracker.prototype.trackError = function(error: unknown, context: Record<string, unknown> = {}) { this.metrics.errorCount++; const err = error as Error; return this.track(LIFECYCLE_EVENTS.ERROR, { error: err?.message || String(error), errorType: err?.name || 'Error', context, totalErrors: this.metrics.errorCount }); };
PanelTelemetryTracker.prototype.trackInteraction = function(action: string, detail: Record<string, unknown> = {}) { this.metrics.interactions++; return this.track(LIFECYCLE_EVENTS.INTERACTION, { action, detail, totalInteractions: this.metrics.interactions }); };
PanelTelemetryTracker.prototype.trackStateChange = function(from: string, to: string, reason = '') { return this.track(LIFECYCLE_EVENTS.STATE_CHANGED, { from, to, reason }); };
PanelTelemetryTracker.prototype.trackRefresh = function(source: string, success: boolean, data: Record<string, unknown> = {}) { return this.track(LIFECYCLE_EVENTS.REFRESH, { source, success, ...data }); };
PanelTelemetryTracker.prototype.getMetrics = function() { const now = Date.now(); return { ...this.metrics, sessionDuration: now - this.sessionStart, avgLoadTime: this.metrics.loadCount > 0 ? (this.metrics.totalLoadTime / this.metrics.loadCount).toFixed(2) : 0, errorRate: this.metrics.loadCount > 0 ? `${((this.metrics.errorCount / this.metrics.loadCount) * 100).toFixed(1)}%` : '0%', idleTime: this.metrics.lastActivity ? now - this.metrics.lastActivity : now - this.sessionStart }; };
PanelTelemetryTracker.prototype.healthCheck = function() { const metrics = this.getMetrics(); const errorRate = parseFloat(metrics.errorRate); return { healthy: errorRate < 10, initialized: this.initialized, hasTelemetryCore: !!this.telemetryCore, metrics, p22Compliant: true }; };
PanelTelemetryTracker.prototype.reset = function() { this.metrics = { loadCount: 0, errorCount: 0, totalLoadTime: 0, interactions: 0, lastActivity: null }; this.sessionStart = Date.now(); };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, p22Compliant: true });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, p22Compliant: true });

export { PanelTelemetryTracker, MODULE_ID, VERSION };
export default PanelTelemetryTracker;
