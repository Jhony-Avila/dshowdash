import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import orchestratorBus from "../bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS } from "../bus/events-map.js";
import metricsAdapter from "../health/metrics-adapter.js";
import logger from "../utils/logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator.telemetry.tracker";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug || false;
};
function OrchestratorTelemetry() {
  this.namespace = "orchestrator";
  this.events = [];
  this.maxEvents = 1e3;
  this.sessionId = null;
  this.startTime = Date.now();
  this.initialized = false;
  this.destroyed = false;
}
OrchestratorTelemetry.prototype.getVersion = () => VERSION;
OrchestratorTelemetry.prototype.isInitialized = function() {
  return this.initialized && !this.destroyed;
};
OrchestratorTelemetry.prototype.init = function(config = {}) {
  if (this.initialized) return this;
  _initPorts();
  this.namespace = config.namespace || "orchestrator";
  this.maxEvents = config.maxEvents || 1e3;
  this.sessionId = this._generateSessionId();
  this.initialized = true;
  this.destroyed = false;
  logger.info(`Telemetry Tracker inicializado (${VERSION})`, { sessionId: this.sessionId });
  return this;
};
OrchestratorTelemetry.prototype._generateSessionId = () => `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
OrchestratorTelemetry.prototype.track = function(eventName, data = {}) {
  const event = { name: eventName, namespace: this.namespace, sessionId: this.sessionId, moduleId: MODULE_ID, data, timestamp: Date.now(), elapsed: Date.now() - this.startTime };
  this.events.push(event);
  if (this.events.length > this.maxEvents) this.events.shift();
  orchestratorBus.emit(`${this.namespace}:telemetry:event`, event);
  const eventBus = _getPort("eventBus");
  if (eventBus?.emit) eventBus.emit(TELEMETRY_EVENTS.EVENT, event);
  if (_debug()) logger.debug(`Telemetry: ${eventName}`, data);
  return event;
};
OrchestratorTelemetry.prototype.trackLifecycle = function(phase, data = {}) {
  return this.track(`${this.namespace}:lifecycle:${phase}`, data);
};
OrchestratorTelemetry.prototype.trackPresetChange = function(presetId, context = {}) {
  metricsAdapter.recordCounter("preset.changes");
  return this.track(ORCHESTRATOR_EVENTS.PRESET_APPLIED, { presetId, context });
};
OrchestratorTelemetry.prototype.trackLayoutChange = function(panels, layoutMode) {
  metricsAdapter.recordGauge("layout.panelCount", panels.length);
  return this.track(ORCHESTRATOR_EVENTS.LAYOUT_CHANGED, { panels, layoutMode, panelCount: panels.length });
};
OrchestratorTelemetry.prototype.trackModuleMount = function(moduleId, durationMs) {
  metricsAdapter.recordTiming("module.mount", durationMs, { moduleId });
  metricsAdapter.recordCounter("module.mounts");
  return this.track(ORCHESTRATOR_EVENTS.MODULE_MOUNTED, { moduleId, durationMs });
};
OrchestratorTelemetry.prototype.trackModuleError = function(moduleId, error) {
  metricsAdapter.recordCounter("module.errors", 1, { moduleId });
  return this.track(ORCHESTRATOR_EVENTS.MODULE_FAILED, { moduleId, error: error.message || String(error) });
};
OrchestratorTelemetry.prototype.trackApiCall = function(endpoint, durationMs, success) {
  metricsAdapter.recordTiming("api.call", durationMs, { endpoint, success });
  if (!success) metricsAdapter.recordCounter("api.failures");
  return this.track("orchestrator:api:call", { endpoint, durationMs, success });
};
OrchestratorTelemetry.prototype.trackSchedulerMode = function(mode) {
  metricsAdapter.recordGauge("scheduler.mode", 0);
  return this.track(ORCHESTRATOR_EVENTS.SCHEDULER_MODE_CHANGED, { mode });
};
OrchestratorTelemetry.prototype.trackHealthCheck = function(summary) {
  metricsAdapter.recordGauge("health.ok", summary.ok);
  metricsAdapter.recordGauge("health.warn", summary.warn);
  metricsAdapter.recordGauge("health.error", summary.error);
  return this.track(ORCHESTRATOR_EVENTS.HEALTH_CHECK, { summary });
};
OrchestratorTelemetry.prototype.getEvents = function() {
  return this.events.slice();
};
OrchestratorTelemetry.prototype.getRecentEvents = function(count = 50) {
  return this.events.slice(-count);
};
OrchestratorTelemetry.prototype.getEventsByType = function(eventName) {
  return this.events.filter((e) => e.name === eventName);
};
OrchestratorTelemetry.prototype.getStats = function() {
  const eventCounts = {};
  this.events.forEach((e) => {
    eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
  });
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, sessionId: this.sessionId, totalEvents: this.events.length, uptime: Date.now() - this.startTime, eventCounts, portsInitialized: Ports.isInitialized() };
};
OrchestratorTelemetry.prototype.clear = function() {
  this.events = [];
  logger.info("Telemetry limpo");
};
OrchestratorTelemetry.prototype.reset = function() {
  this.clear();
  this.sessionId = this._generateSessionId();
  this.destroyed = false;
};
OrchestratorTelemetry.prototype.destroy = function() {
  this.clear();
  this.sessionId = null;
  this.initialized = false;
  this.destroyed = true;
  logger.info("Telemetry Tracker destru\xEDdo");
};
const orchestratorTelemetry = new OrchestratorTelemetry();
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { trackerReady: true, portsInitialized: Ports.isInitialized() }, p24Instrumented: true, p24DynamicEventsAllowed: 1, timestamp: Date.now() };
}
var tracker_default = orchestratorTelemetry;
export {
  MODULE_ID,
  OrchestratorTelemetry,
  VERSION,
  tracker_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  orchestratorTelemetry
};
