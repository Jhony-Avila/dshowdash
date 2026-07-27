import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { TELEMETRY_EVENTS, TELEMETRY_SCHEMA } from "../core/contracts.js";
const VERSION = "3.8.0-P2-ENTERPRISE";
const MODULE_ID = "components.cache-manager.telemetry.tracker";
const COMPONENT_NAME = "cache-manager";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let eventLog = [];
const maxLogSize = 500;
let eventCount = 0;
let _debug = false;
let _metrics = { totalEvents: 0, eventsByType: {}, schemaValidations: 0, schemaViolations: 0, telemetryCoreForwards: 0, lastEventAt: null };
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};
const validateEventData = (eventName, data) => {
  const requiredFields = TELEMETRY_SCHEMA[eventName];
  if (!requiredFields) return { valid: true };
  _metrics.schemaValidations++;
  const missing = requiredFields.filter((field) => data[field] === void 0);
  if (missing.length > 0) {
    _metrics.schemaViolations++;
    return { valid: false, missing };
  }
  return { valid: true };
};
const setDebug = (debug) => {
  _debug = debug;
};
const getVersion = () => VERSION;
const trackCacheEvent = (eventName, data) => {
  if (!data) data = {};
  const event = { timestamp: Date.now(), component: COMPONENT_NAME, event: eventName, data: { ...data, moduleId: data.moduleId || MODULE_ID }, index: eventCount++ };
  const validation = validateEventData(eventName, data);
  if (!validation.valid) {
    event.schemaWarning = `Missing fields: ${validation.missing.join(", ")}`;
    _log("warn", "Schema validation failed for", eventName, validation.missing);
  }
  eventLog.push(event);
  if (eventLog.length > maxLogSize) eventLog.shift();
  _metrics.totalEvents++;
  _metrics.eventsByType[eventName] = (_metrics.eventsByType[eventName] || 0) + 1;
  _metrics.lastEventAt = Date.now();
  const tel = _getPort("telemetry");
  if (tel?.track) {
    try {
      tel.track(eventName, { component: COMPONENT_NAME, ...data });
      _metrics.telemetryCoreForwards++;
    } catch (e) {
    }
  }
  return event;
};
const getEventLog = () => eventLog.slice();
const clearEventLog = () => {
  eventLog.length = 0;
  eventCount = 0;
  _log("info", "Event log cleared");
};
const getRecentEvents = (count = 10) => eventLog.slice(-count);
const getEventsByType = (eventType) => eventLog.filter((e) => e["event"] === eventType);
const getTrackerStats = () => ({ version: VERSION, moduleId: MODULE_ID, eventsCount: eventLog.length, totalTracked: eventCount, maxSize: maxLogSize, eventCounts: { ..._metrics.eventsByType }, schemaStats: { validations: _metrics.schemaValidations, violations: _metrics.schemaViolations } });
const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const tel = _getPort("telemetry");
  const logger = _getPort("logger");
  const checks = { logInitialized: Array.isArray(eventLog), logNotOverflowing: eventLog.length < maxLogSize, lowSchemaViolations: _metrics.schemaViolations < 20, telemetryCoreAvailable: !!tel?.track, loggerReady: !!logger, portsInitialized: portsSnapshot._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
};
const info = () => {
  const portsSnapshot = Ports.snapshot();
  const tel = _getPort("telemetry");
  const logger = _getPort("logger");
  return { version: VERSION, moduleId: MODULE_ID, debug: _debug, eventLogSize: eventLog.length, maxLogSize, metrics: { ..._metrics }, availableEvents: Object.keys(TELEMETRY_EVENTS).length, schemasConfigured: Object.keys(TELEMETRY_SCHEMA).length, healthCheck: healthCheck(), integrations: { telemetryCoreAvailable: !!tel?.track, loggerReady: !!logger }, portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
};
const resetMetrics = () => {
  _metrics = { totalEvents: 0, eventsByType: {}, schemaValidations: 0, schemaViolations: 0, telemetryCoreForwards: 0, lastEventAt: null };
  _log("info", "Metrics reset");
};
var tracker_default = { trackCacheEvent, getEventLog, clearEventLog, getRecentEvents, getEventsByType, getTrackerStats, getVersion, setDebug, healthCheck, info, resetMetrics, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  COMPONENT_NAME,
  MODULE_ID,
  VERSION,
  clearEventLog,
  tracker_default as default,
  getEventLog,
  getEventsByType,
  getPorts,
  getRecentEvents,
  getTrackerStats,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  setDebug,
  trackCacheEvent
};
