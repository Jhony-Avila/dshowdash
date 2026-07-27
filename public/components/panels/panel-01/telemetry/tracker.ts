// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01.telemetry.tracker
// PURPOSE: Panel-01 Telemetry Tracker
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
//   (none)
// LISTENS (eventos):
//   'visibilitychange'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

const MODULE_ID = 'panel-01.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getCurrentPath() { const router = _getPort('router'); if (router?.getCurrentRoute) { const r = router.getCurrentRoute(); return r?.path || (typeof r === 'string' ? r : '/'); } if (router?.current) return router.current; return '/'; }

function PanelTelemetryTracker(this: any, panelId: string, options: { sampleRate?: number; debug?: boolean } = {}) { options = options || {}; this.panelId = panelId; this.initialized = false; this.telemetryCore = null; this.sampleRate = options.sampleRate || 1.0; this.debug = options.debug || false; this.metrics = { loads: 0, errors: 0, interactions: 0, renders: 0, apiCalls: 0, avgLoadTime: 0, totalLoadTime: 0 }; this.performance = { firstLoad: null, lastLoad: null, loadTimes: [] }; this.sessionStart = Date.now(); this._buffer = []; this._flushInterval = null; this._visibilityHandler = null; this._abortController = null; _initPorts(); }

PanelTelemetryTracker.prototype.init = function() { if (this.initialized) return this; try { const telemetry = _getPort('telemetry'); if (telemetry) this.telemetryCore = telemetry; } catch (e) {} this.initialized = true; const self = this; this._flushInterval = setInterval(() => self._flush(), 30000); if (hasDocument) { this._abortController = new AbortController(); this._visibilityHandler = () => self.track(LIFECYCLE_EVENTS.VISIBILITY, { visible: !document.hidden }); document.addEventListener('visibilitychange', this._visibilityHandler, { signal: this._abortController.signal }); } this._log('Initialized'); return this; };

PanelTelemetryTracker.prototype.track = function(event: string, data: Record<string, unknown>) { if (!this.initialized) this.init(); data = data || {}; if (Math.random() > this.sampleRate) return null; const payload = Object.assign({ event: `panel.${this.panelId}.${event}`, panelId: this.panelId, timestamp: Date.now(), sessionDuration: Date.now() - this.sessionStart, url: _getCurrentPath(), source: MODULE_ID }, data); this._buffer.push(payload); if (this.debug) this._log(`Track: ${event}`, data); if (this.telemetryCore?.track) this.telemetryCore.track(payload.event, payload); return payload; };

PanelTelemetryTracker.prototype.trackLoad = function(duration: number, success: boolean, count: number) { if (count === undefined) count = 0; this.metrics.loads++; this.metrics.totalLoadTime += duration; this.metrics.avgLoadTime = this.metrics.totalLoadTime / this.metrics.loads; this.performance.loadTimes.push(duration); if (this.performance.loadTimes.length > 100) this.performance.loadTimes.shift(); if (!this.performance.firstLoad) this.performance.firstLoad = duration; this.performance.lastLoad = duration; if (!success) this.metrics.errors++; return this.track(LIFECYCLE_EVENTS.DATA_LOADED, { duration, success, count, avgTime: Math.round(this.metrics.avgLoadTime) }); };
PanelTelemetryTracker.prototype.trackError = function(error: Error | string, context: string, severity: string) { if (context === undefined) context = ''; if (severity === undefined) severity = 'error'; this.metrics.errors++; return this.track(LIFECYCLE_EVENTS.ERROR, { error: (error instanceof Error ? error.message : null) || String(error), stack: (error instanceof Error ? error.stack?.slice(0, 500) : null) || null, context, severity }); };
PanelTelemetryTracker.prototype.trackInteraction = function(action: string, detail: Record<string, unknown>) { detail = detail || {}; this.metrics.interactions++; return this.track(LIFECYCLE_EVENTS.INTERACTION, Object.assign({ action }, detail)); };
PanelTelemetryTracker.prototype.trackRender = function(component: string, duration: number) { this.metrics.renders++; return this.track('render', { component, duration }); };
PanelTelemetryTracker.prototype.trackApi = function(endpoint: string, method: string, duration: number, success: boolean) { this.metrics.apiCalls++; return this.track('api', { endpoint, method, duration, success }); };
PanelTelemetryTracker.prototype.trackFilter = function(filters: Record<string, unknown>) { const activeFilters = Object.keys(filters).filter(k => filters[k]); return this.track('filter', { activeFilters, count: activeFilters.length }); };
PanelTelemetryTracker.prototype.trackSort = function(field: string, order: string) { return this.track('sort', { field, order }); };
PanelTelemetryTracker.prototype.trackPagination = function(page: number, limit: number, total: number) { return this.track('pagination', { page, limit, total }); };
PanelTelemetryTracker.prototype.trackExport = function(format: string, count: number) { return this.track('export', { format, count }); };
PanelTelemetryTracker.prototype.trackDrawer = function(action: string, itemId: string | number) { return this.track('drawer', { action, itemId }); };
PanelTelemetryTracker.prototype.startTimer = (label: string) => ({
  label,
  start: performance.now()
});
PanelTelemetryTracker.prototype.endTimer = function(timer: { label: string; start: number }) { if (!timer) return 0; const duration = Math.round(performance.now() - timer.start); this.track('timer', { label: timer.label, duration }); return duration; };
PanelTelemetryTracker.prototype.getMetrics = function() { return Object.assign({}, this.metrics, { sessionDuration: Date.now() - this.sessionStart, performance: { firstLoad: this.performance.firstLoad, lastLoad: this.performance.lastLoad, p50: this._percentile(this.performance.loadTimes, 0.5), p95: this._percentile(this.performance.loadTimes, 0.95), p99: this._percentile(this.performance.loadTimes, 0.99) } }); };
PanelTelemetryTracker.prototype._percentile = (arr: number[], p: number) => { if (!arr.length) return 0; const sorted = arr.slice().sort((a: number, b: number) => a - b); const idx = Math.ceil(sorted.length * p) - 1; return sorted[Math.max(0, idx)]; };
PanelTelemetryTracker.prototype._flush = function() { if (this._buffer.length === 0) return; const events = this._buffer.slice(); this._buffer = []; if (this.debug) this._log(`Flushed ${events.length} events`); };
PanelTelemetryTracker.prototype._log = function() { const args = Array.prototype.slice.call(arguments); const logger = _getPort('logger'); if (this.debug && logger?.debug) logger.debug(`[${MODULE_ID}]`, ...args); };
PanelTelemetryTracker.prototype.destroy = function() { if (this._flushInterval) { clearInterval(this._flushInterval); this._flushInterval = null; } if (this._abortController) { this._abortController.abort(); this._abortController = null; } this._visibilityHandler = null; this._flush(); this.initialized = false; };
PanelTelemetryTracker.prototype.healthCheck = function() { return { healthy: true, initialized: this.initialized, hasTelemetryCore: !!this.telemetryCore, metrics: this.getMetrics(), version: VERSION, moduleId: MODULE_ID, p22Compliant: true }; };

export function info() { return { moduleId: MODULE_ID, version: VERSION, p22Compliant: true }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, p22Compliant: true }; }

export { PanelTelemetryTracker, VERSION, MODULE_ID };
export default PanelTelemetryTracker;
