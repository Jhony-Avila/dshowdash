import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "3.4.0-P17WI";
const MODULE_ID = "permissions-guard.telemetry.tracker";
const NAMESPACE = "permissions";
const MAX_EVENTS = 100;
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
let events = [];
let metrics = { totalEvents: 0, checkEvents: 0, grantedEvents: 0, deniedEvents: 0, lifecycleEvents: 0, lastEventAt: null };
function getTelemetryCore() {
  return _getPort("telemetry");
}
function getEventBus() {
  return _getPort("eventBus");
}
function logEvent(type, data) {
  if (data === void 0) data = {};
  const event = { id: `${NAMESPACE}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, namespace: NAMESPACE, type, data, timestamp: Date.now() };
  events.push(event);
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
  metrics.totalEvents++;
  metrics.lastEventAt = event.timestamp;
  return event;
}
function track(type, data) {
  if (data === void 0) data = {};
  const event = logEvent(type, data);
  if (type.indexOf("check") >= 0) metrics.checkEvents++;
  if (type.indexOf("granted") >= 0 || type.indexOf("allowed") >= 0) metrics.grantedEvents++;
  if (type.indexOf("denied") >= 0) metrics.deniedEvents++;
  if (type.indexOf("init") >= 0 || type.indexOf("reset") >= 0 || type.indexOf("shutdown") >= 0) metrics.lifecycleEvents++;
  const TC = getTelemetryCore();
  if (TC && TC.track) {
    try {
      TC.track(`${NAMESPACE}:${type}`, data);
    } catch (e) {
    }
  }
  const EB = getEventBus();
  if (EB && EB.emit && type.indexOf("permissions:") === 0) {
    try {
      EB.emit(type, data);
    } catch (e) {
    }
  }
  return event;
}
function trackPermissionEvent(type, data) {
  return track(type, data);
}
function getEventLog(limit) {
  if (limit === void 0) limit = 50;
  return events.slice(-limit);
}
function getRecentEvents(limit) {
  if (limit === void 0) limit = 10;
  return events.slice(-limit);
}
function clearEventLog() {
  events = [];
}
function getMetrics() {
  return Object.assign({}, metrics);
}
function getTrackerStats() {
  return Object.assign({}, metrics, { bufferSize: events.length, telemetryCoreAvailable: !!getTelemetryCore(), eventBusAvailable: !!getEventBus(), portsInitialized: Ports.isInitialized() });
}
function clear() {
  events = [];
  metrics = { totalEvents: 0, checkEvents: 0, grantedEvents: 0, deniedEvents: 0, lifecycleEvents: 0, lastEventAt: null };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, bufferSize: events.length, metrics: getMetrics(), portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { ready: true, portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized() };
}
var tracker_default = { track, trackPermissionEvent, getEventLog, getRecentEvents, clearEventLog, getMetrics, getTrackerStats, clear, getVersion, injectPorts, getPorts, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  clear,
  clearEventLog,
  tracker_default as default,
  getEventLog,
  getMetrics,
  getPorts,
  getRecentEvents,
  getTrackerStats,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  track,
  trackPermissionEvent
};
