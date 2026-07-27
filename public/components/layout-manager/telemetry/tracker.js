import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.6.0-P17WI";
const MODULE_ID = "layout-manager.telemetry.tracker";
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
const COMPONENT_NAME = "layout-manager";
const EVENT_PREFIX = "layout:";
const eventLog = [];
const maxLogSize = 500;
let _debug = false;
let _metrics = { totalEvents: 0, eventsByType: {}, telemetryCoreForwards: 0, eventBusForwards: 0, lastEventAt: null, lastEventLocalTime: null };
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    if (logger.error) logger.error(`[${MODULE_ID}]`, msg, data || "");
    return;
  }
  if (_debug && logger.debug) logger.debug(`[${MODULE_ID}]`, msg, data || "");
};
function _buildTimestamp() {
  const tel = _getPort("telemetry");
  if (tel && tel.buildTimestamp) return tel.buildTimestamp();
  const now = Date.now();
  return { timestampUtc: now, isoUtc: new Date(now).toISOString(), localTime: new Date(now).toLocaleString("pt-BR"), timeZone: "America/Sao_Paulo", locale: "pt-BR" };
}
function setDebug(debug) {
  _debug = debug;
}
function normalizeEventName(name) {
  if (name.indexOf(EVENT_PREFIX) === 0) return name;
  return EVENT_PREFIX + name;
}
function trackLayoutEvent(eventName, data) {
  if (!data) data = {};
  const ts = _buildTimestamp();
  const normalizedName = normalizeEventName(eventName);
  const event = { timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone, component: COMPONENT_NAME, event: normalizedName, data };
  eventLog.push(event);
  if (eventLog.length > maxLogSize) eventLog.shift();
  _metrics.totalEvents++;
  _metrics.eventsByType[normalizedName] = (_metrics.eventsByType[normalizedName] || 0) + 1;
  _metrics.lastEventAt = ts.timestampUtc;
  _metrics.lastEventLocalTime = ts.localTime;
  const tel = _getPort("telemetry");
  if (tel) {
    try {
      tel.track(normalizedName, Object.assign({ component: COMPONENT_NAME, timestampUtc: ts.timestampUtc, localTime: ts.localTime }, data));
      _metrics.telemetryCoreForwards++;
    } catch (err) {
    }
  }
  const eb = _getPort("eventBus");
  if (eb) {
    try {
      eb.emit(TELEMETRY_EVENTS.EVENT, event);
      _metrics.eventBusForwards++;
    } catch (err) {
    }
  }
  _log("info", `[${ts.localTime}] Event:`, normalizedName);
  return event;
}
function getEventLog() {
  return eventLog.slice();
}
function clearEventLog() {
  eventLog.length = 0;
}
function getRecentEvents(count) {
  if (!count) count = 10;
  return eventLog.slice(-count);
}
function healthCheck() {
  const ts = _buildTimestamp();
  const tel = _getPort("telemetry");
  const logger = _getPort("logger");
  const buildTimestampAvailable = !!(tel && tel.buildTimestamp);
  const checks = { logInitialized: Array.isArray(eventLog), logNotOverflowing: eventLog.length < maxLogSize, hasTrackedEvents: _metrics.totalEvents > 0, buildTimestampAvailable, portsInitialized: Ports.isInitialized(), loggerAvailable: !!logger };
  let passed = 0;
  for (const k in checks) {
    if (checks[k]) passed++;
  }
  return { status: passed === Object.keys(checks).length ? "HEALTHY" : "DEGRADED", score: passed, maxScore: Object.keys(checks).length, scoreDisplay: `${passed}/${Object.keys(checks).length}`, checks, version: VERSION, moduleId: MODULE_ID, timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone };
}
function info() {
  const ts = _buildTimestamp();
  const tel = _getPort("telemetry");
  const eb = _getPort("eventBus");
  const logger = _getPort("logger");
  return { version: VERSION, moduleId: MODULE_ID, debug: _debug, portsInitialized: Ports.isInitialized(), eventLogSize: eventLog.length, maxLogSize, eventPrefix: EVENT_PREFIX, metrics: Object.assign({}, _metrics), healthCheck: healthCheck(), integrations: { telemetryCoreAvailable: !!tel, eventBusAvailable: !!eb, loggerAvailable: !!logger }, timestampUtc: ts.timestampUtc, localTime: ts.localTime, timeZone: ts.timeZone };
}
function resetMetrics() {
  _metrics = { totalEvents: 0, eventsByType: {}, telemetryCoreForwards: 0, eventBusForwards: 0, lastEventAt: null, lastEventLocalTime: null };
}
function getVersion() {
  return VERSION;
}
var tracker_default = trackLayoutEvent;
export {
  MODULE_ID,
  VERSION,
  clearEventLog,
  tracker_default as default,
  getEventLog,
  getPorts,
  getRecentEvents,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  setDebug,
  trackLayoutEvent
};
