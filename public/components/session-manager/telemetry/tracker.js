import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.2.0-P17WI";
const MODULE_ID = "session-manager.telemetry.tracker";
const NAMESPACE = "session";
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
const _metrics = { totalEvents: 0, lifecycleEvents: 0, apiEvents: 0, authEvents: 0, errorEvents: 0, globalStateEvents: 0, lastEventAt: null, lastEventLocalTime: null };
function _buildTimestamp() {
  const tel = _getPort("telemetry");
  if (tel && tel.buildTimestamp) return tel.buildTimestamp();
  const now = Date.now();
  return { timestampUtc: now, isoUtc: new Date(now).toISOString(), localTime: new Date(now).toLocaleString("pt-BR"), timeZone: "America/Sao_Paulo", locale: "pt-BR" };
}
function getTelemetryCore() {
  return _getPort("telemetry");
}
function getEventBus() {
  return _getPort("eventBus");
}
function logEvent(type, data) {
  if (data === void 0) data = {};
  const ts = _buildTimestamp();
  const event = { id: `${NAMESPACE}-${ts.timestampUtc}-${Math.random().toString(36).slice(2, 6)}`, namespace: NAMESPACE, type, data, timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone };
  events.push(event);
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
  _metrics.totalEvents++;
  _metrics.lastEventAt = ts.timestampUtc;
  _metrics.lastEventLocalTime = ts.localTime;
  return event;
}
function trackSessionEvent(type, data) {
  if (data === void 0) data = {};
  const event = logEvent(type, data);
  if (type.indexOf("lifecycle") >= 0) _metrics.lifecycleEvents++;
  if (type.indexOf("api") >= 0) _metrics.apiEvents++;
  if (type.indexOf("auth") >= 0) _metrics.authEvents++;
  if (type.indexOf("error") >= 0) _metrics.errorEvents++;
  if (type.indexOf("global-state") >= 0) _metrics.globalStateEvents++;
  const TC = getTelemetryCore();
  if (TC && TC.track) {
    try {
      TC.track(`${NAMESPACE}:${type}`, Object.assign({ timestampUtc: event.timestampUtc, localTime: event.localTime }, data));
    } catch (e) {
    }
  }
  return event;
}
function getEventLog(limit = 50) {
  return events.slice(-limit);
}
function getRecentEvents(limit = 10) {
  return events.slice(-limit);
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function getStats() {
  return Object.assign({}, _metrics, { bufferSize: events.length, maxBufferSize: MAX_EVENTS, telemetryCoreAvailable: !!getTelemetryCore(), eventBusAvailable: !!getEventBus(), portsInitialized: Ports.isInitialized() });
}
function clear() {
  events = [];
  Object.keys(_metrics).forEach((key) => {
    _metrics[key] = key === "lastEventAt" || key === "lastEventLocalTime" ? null : 0;
  });
}
function getVersion() {
  return VERSION;
}
function info() {
  const ts = _buildTimestamp();
  return { moduleId: MODULE_ID, version: VERSION, namespace: NAMESPACE, bufferSize: events.length, maxBufferSize: MAX_EVENTS, metrics: Object.assign({}, _metrics), integrations: { telemetryCore: !!getTelemetryCore(), eventBus: !!getEventBus() }, timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  const ts = _buildTimestamp();
  const tel = _getPort("telemetry");
  const buildTimestampAvailable = !!(tel && tel.buildTimestamp);
  const checks = { bufferNotOverflowing: events.length <= MAX_EVENTS, eventsTracking: _metrics.totalEvents >= 0, lowErrorEventRate: _metrics.totalEvents === 0 || _metrics.errorEvents / _metrics.totalEvents < 0.3, buildTimestampAvailable, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, healthy: passed === total, checks, totalEvents: _metrics.totalEvents, version: VERSION, moduleId: MODULE_ID, timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone, portsInitialized: Ports.isInitialized() };
}
var tracker_default = { track: trackSessionEvent, trackSessionEvent, getEventLog, getRecentEvents, getMetrics, getStats, clear, getVersion, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clear,
  tracker_default as default,
  getEventLog,
  getMetrics,
  getPorts,
  getRecentEvents,
  getStats,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  trackSessionEvent
};
