// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator.telemetry.tracker
// PURPOSE: Orchestrator Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TELEMETRY_EVENTS from /core/runtime/events/catalog/telemetry.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   ORCHESTRATOR_EVENTS from ../bus/events-map.js
//   orchestratorBus from ../bus/event-bus-adapter.js
//   metricsAdapter from ../health/metrics-adapter.js
//   logger from ../utils/logger.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   OrchestratorTelemetry() — exported function
//   orchestratorTelemetry — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TELEMETRY_EVENTS.EVENT
//   `${this.namespace}:telemetry:event`
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import orchestratorBus from '../bus/event-bus-adapter.js';
import { ORCHESTRATOR_EVENTS } from '../bus/events-map.js';
import metricsAdapter from '../health/metrics-adapter.js';
import logger from '../utils/logger.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-orchestrator.telemetry.tracker';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug || false; };

function OrchestratorTelemetry(this: any) {
    this.namespace = 'orchestrator';
    this.events = [];
    this.maxEvents = 1000;
    this.sessionId = null;
    this.startTime = Date.now();
    this.initialized = false;
    this.destroyed = false;
}

OrchestratorTelemetry.prototype.getVersion = () => VERSION;
OrchestratorTelemetry.prototype.isInitialized = function() { return this.initialized && !this.destroyed; };

OrchestratorTelemetry.prototype.init = function(config: Record<string, unknown> = {}) {
    if (this.initialized) return this;
    _initPorts();
    this.namespace = config.namespace || 'orchestrator';
    this.maxEvents = config.maxEvents || 1000;
    this.sessionId = this._generateSessionId();
    this.initialized = true;
    this.destroyed = false;
    logger.info(`Telemetry Tracker inicializado (${VERSION})`, { sessionId: this.sessionId });
    return this;
};

OrchestratorTelemetry.prototype._generateSessionId = () => `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

OrchestratorTelemetry.prototype.track = function(eventName: string, data: Record<string, unknown> = {}) {
    const event = { name: eventName, namespace: this.namespace, sessionId: this.sessionId, moduleId: MODULE_ID, data, timestamp: Date.now(), elapsed: Date.now() - this.startTime };
    this.events.push(event);
    if (this.events.length > this.maxEvents) this.events.shift();
    orchestratorBus.emit(`${this.namespace}:telemetry:event`, event);
    const eventBus = _getPort('eventBus');
    if (eventBus?.emit) eventBus.emit(TELEMETRY_EVENTS.EVENT, event);
    if (_debug()) logger.debug(`Telemetry: ${eventName}`, data);
    return event;
};

OrchestratorTelemetry.prototype.trackLifecycle = function(phase: string, data: Record<string, unknown> = {}) { return this.track(`${this.namespace}:lifecycle:${phase}`, data); };
OrchestratorTelemetry.prototype.trackPresetChange = function(presetId: string, context: Record<string, unknown> = {}) { metricsAdapter.recordCounter('preset.changes'); return this.track(ORCHESTRATOR_EVENTS.PRESET_APPLIED, { presetId, context }); };
OrchestratorTelemetry.prototype.trackLayoutChange = function(panels: unknown[], layoutMode: string) { metricsAdapter.recordGauge('layout.panelCount', panels.length); return this.track(ORCHESTRATOR_EVENTS.LAYOUT_CHANGED, { panels, layoutMode, panelCount: panels.length }); };
OrchestratorTelemetry.prototype.trackModuleMount = function(moduleId: string, durationMs: number) { metricsAdapter.recordTiming('module.mount', durationMs, { moduleId }); metricsAdapter.recordCounter('module.mounts'); return this.track(ORCHESTRATOR_EVENTS.MODULE_MOUNTED, { moduleId, durationMs }); };
OrchestratorTelemetry.prototype.trackModuleError = function(moduleId: string, error: unknown) { metricsAdapter.recordCounter('module.errors', 1, { moduleId }); return this.track(ORCHESTRATOR_EVENTS.MODULE_FAILED, { moduleId, error: (error as Error).message || String(error) }); };
OrchestratorTelemetry.prototype.trackApiCall = function(endpoint: string, durationMs: number, success: boolean) { metricsAdapter.recordTiming('api.call', durationMs, { endpoint, success }); if (!success) metricsAdapter.recordCounter('api.failures'); return this.track('orchestrator:api:call', { endpoint, durationMs, success }); };
OrchestratorTelemetry.prototype.trackSchedulerMode = function(mode: string) { metricsAdapter.recordGauge('scheduler.mode', 0); return this.track(ORCHESTRATOR_EVENTS.SCHEDULER_MODE_CHANGED, { mode }); };
OrchestratorTelemetry.prototype.trackHealthCheck = function(summary: Record<string, number>) { metricsAdapter.recordGauge('health.ok', summary.ok); metricsAdapter.recordGauge('health.warn', summary.warn); metricsAdapter.recordGauge('health.error', summary.error); return this.track(ORCHESTRATOR_EVENTS.HEALTH_CHECK, { summary }); };

OrchestratorTelemetry.prototype.getEvents = function() { return this.events.slice(); };
OrchestratorTelemetry.prototype.getRecentEvents = function(count: number = 50) { return this.events.slice(-count); };
OrchestratorTelemetry.prototype.getEventsByType = function(eventName: string) { return this.events.filter((e: { name: string }) => e.name === eventName); };

OrchestratorTelemetry.prototype.getStats = function() {
    const eventCounts: Record<string, number> = {};
    this.events.forEach((e: { name: string }) => { eventCounts[e.name] = (eventCounts[e.name] || 0) + 1; });
    return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, sessionId: this.sessionId, totalEvents: this.events.length, uptime: Date.now() - this.startTime, eventCounts, portsInitialized: Ports.isInitialized() };
};

OrchestratorTelemetry.prototype.clear = function() { this.events = []; logger.info('Telemetry limpo'); };
OrchestratorTelemetry.prototype.reset = function() { this.clear(); this.sessionId = this._generateSessionId(); this.destroyed = false; };
OrchestratorTelemetry.prototype.destroy = function() { this.clear(); this.sessionId = null; this.initialized = false; this.destroyed = true; logger.info('Telemetry Tracker destruído'); };

// @ts-expect-error strict migration — TS7009
const orchestratorTelemetry = new OrchestratorTelemetry();

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { trackerReady: true, portsInitialized: Ports.isInitialized() }, p24Instrumented: true, p24DynamicEventsAllowed: 1, timestamp: Date.now() }; }

export { OrchestratorTelemetry, orchestratorTelemetry, VERSION, MODULE_ID, info, healthCheck };
export default orchestratorTelemetry;
