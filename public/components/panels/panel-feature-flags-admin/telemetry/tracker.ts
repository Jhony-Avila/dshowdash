// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-P22-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin.telemetry.tracker
// PURPOSE: Panel Feature Flags Admin - Telemetry Tracker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const MODULE_ID = 'panel-feature-flags-admin.telemetry.tracker';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export class PanelTelemetryTracker {
  [key: string]: any;
  constructor(panelId: string, version: string) { this.panelId = panelId; this.version = version; this.initialized = false; this.telemetryCore = null; this.metrics = { loadCount: 0, errorCount: 0, totalLoadTime: 0, interactions: 0, toggleCount: 0, createCount: 0, updateCount: 0, deleteCount: 0, lastActivity: null }; this.sessionStart = Date.now(); _initPorts(); }
  init() { if (this.initialized) return; try { const telemetry = _getPort('telemetry'); if (telemetry) { this.telemetryCore = telemetry; this.telemetryCore.register?.({ namespace: `panel:${this.panelId}`, version: this.version, flushIntervalMs: 30000 }); } this.initialized = true; } catch { } }
  track(event: string, data: Record<string, unknown> = {}) { if (!this.initialized) this.init(); const payload = { event: `panel.${this.panelId}.${event}`, panelId: this.panelId, version: this.version, timestamp: Date.now(), sessionDuration: Date.now() - this.sessionStart, source: MODULE_ID, ...data }; this.metrics.lastActivity = Date.now(); if (this.telemetryCore && this.telemetryCore.track) this.telemetryCore.track(payload.event, payload); return payload; }
  trackLoad(duration: number, success: boolean, itemCount = 0) { this.metrics.loadCount++; this.metrics.totalLoadTime += duration; if (!success) this.metrics.errorCount++; return this.track(LIFECYCLE_EVENTS.DATA_LOADED, { duration, success, itemCount, avgLoadTime: this.metrics.totalLoadTime / this.metrics.loadCount }); }
  trackError(error: Error | unknown, context: Record<string, unknown> = {}) { this.metrics.errorCount++; return this.track(LIFECYCLE_EVENTS.ERROR, { error: (error as Error)?.message || String(error), context, totalErrors: this.metrics.errorCount }); }
  trackToggle(flagKey: string, newState: unknown) { this.metrics.toggleCount++; this.metrics.interactions++; return this.track('flag.toggle', { flagKey, newState, totalToggles: this.metrics.toggleCount }); }
  trackCreate(flagKey: string) { this.metrics.createCount++; this.metrics.interactions++; return this.track('flag.create', { flagKey, totalCreates: this.metrics.createCount }); }
  trackUpdate(flagKey: string) { this.metrics.updateCount++; this.metrics.interactions++; return this.track('flag.update', { flagKey, totalUpdates: this.metrics.updateCount }); }
  trackDelete(flagKey: string) { this.metrics.deleteCount++; this.metrics.interactions++; return this.track('flag.delete', { flagKey, totalDeletes: this.metrics.deleteCount }); }
  getMetrics() { const now = Date.now(); return { ...this.metrics, sessionDuration: now - this.sessionStart, avgLoadTime: this.metrics.loadCount > 0 ? (this.metrics.totalLoadTime / this.metrics.loadCount).toFixed(2) : 0, errorRate: this.metrics.loadCount > 0 ? `${((this.metrics.errorCount / this.metrics.loadCount) * 100).toFixed(1)}%` : '0%' }; }
  healthCheck() { const metrics = this.getMetrics(); const errorRate = parseFloat(metrics.errorRate); return { healthy: errorRate < 10, initialized: this.initialized, hasTelemetryCore: !!this.telemetryCore, portsInitialized: Ports.isInitialized(), metrics, p22Compliant: true }; }
  reset() { this.metrics = { loadCount: 0, errorCount: 0, totalLoadTime: 0, interactions: 0, toggleCount: 0, createCount: 0, updateCount: 0, deleteCount: 0, lastActivity: null }; this.sessionStart = Date.now(); }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p22Compliant: true }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, p22Compliant: true }; }

export default PanelTelemetryTracker;
