import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.error-boundary.telemetry.tracker";
const NAMESPACE = "error-boundary";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const CONFIG = {
  enabled: true,
  maxLogSize: 500,
  logToConsole: false
};
const _eventLog = [];
const _metrics = {
  eventsTracked: 0,
  errorEvents: 0,
  lifecycleEvents: 0,
  lastEventAt: null,
  lastEventLocalTime: null
};
const _hasTelemetryCore = () => {
  const t = _getPort("telemetry");
  return t && typeof t.track === "function";
};
const _hasEventBus = () => {
  const eb = _getPort("eventBus");
  return eb && typeof eb.emit === "function";
};
const _buildTimestamp = () => {
  const t = _getPort("telemetry");
  if (t?.buildTimestamp) return t.buildTimestamp();
  const now = Date.now();
  return {
    timestampUtc: now,
    isoUtc: new Date(now).toISOString(),
    localTime: new Date(now).toLocaleString("pt-BR"),
    timeZone: "America/Sao_Paulo",
    locale: "pt-BR"
  };
};
function trackErrorEvent(eventName, data = {}) {
  if (!CONFIG.enabled) return false;
  const ts = _buildTimestamp();
  const event = {
    timestampUtc: ts.timestampUtc,
    localTime: ts.localTime,
    timeZone: ts.timeZone,
    namespace: NAMESPACE,
    event: eventName,
    data
  };
  _eventLog.push(event);
  if (_eventLog.length > CONFIG.maxLogSize) _eventLog.shift();
  _metrics.eventsTracked++;
  _metrics.lastEventAt = ts.timestampUtc;
  _metrics.lastEventLocalTime = ts.localTime;
  if (eventName.includes("error") || eventName.includes("caught")) {
    _metrics.errorEvents++;
  }
  if (eventName.includes("lifecycle") || eventName.includes("init") || eventName.includes("shutdown")) {
    _metrics.lifecycleEvents++;
  }
  const tel = _getPort("telemetry");
  if (tel?.track) {
    try {
      tel.track(`${NAMESPACE}:${eventName}`, {
        component: NAMESPACE,
        timestampUtc: ts.timestampUtc,
        localTime: ts.localTime,
        ...data
      });
    } catch (e) {
    }
  }
  const eb = _getPort("eventBus");
  if (eb?.emit) {
    try {
      eb.emit(TELEMETRY_EVENTS.EVENT, event);
    } catch (e) {
    }
  }
  return true;
}
function getEventLog() {
  return _eventLog.slice();
}
function clearEventLog() {
  _eventLog.length = 0;
  return true;
}
function getRecentEvents(count = 10) {
  return _eventLog.slice(-count);
}
function getMetrics() {
  return {
    eventsTracked: _metrics.eventsTracked,
    errorEvents: _metrics.errorEvents,
    lifecycleEvents: _metrics.lifecycleEvents,
    lastEventAt: _metrics.lastEventAt,
    lastEventLocalTime: _metrics.lastEventLocalTime,
    eventLogSize: _eventLog.length,
    telemetryCoreAvailable: _hasTelemetryCore(),
    eventBusAvailable: _hasEventBus()
  };
}
function configure(options = {}) {
  if (typeof options.enabled === "boolean") CONFIG.enabled = options.enabled;
  if (typeof options.maxLogSize === "number") CONFIG.maxLogSize = options.maxLogSize;
  if (typeof options.logToConsole === "boolean") CONFIG.logToConsole = options.logToConsole;
  return { ...CONFIG };
}
function resetMetrics() {
  _metrics.eventsTracked = 0;
  _metrics.errorEvents = 0;
  _metrics.lifecycleEvents = 0;
  _metrics.lastEventAt = null;
  _metrics.lastEventLocalTime = null;
  return true;
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const ts = _buildTimestamp();
  const m = getMetrics();
  const t = _getPort("telemetry");
  const buildTimestampAvailable = t && typeof t.buildTimestamp === "function";
  const checks = {
    enabled: CONFIG.enabled,
    bufferNotOverflowing: _eventLog.length < CONFIG.maxLogSize,
    telemetryCoreAvailable: m.telemetryCoreAvailable,
    eventBusAvailable: m.eventBusAvailable,
    buildTimestampAvailable,
    portsInitialized: portsSnapshot._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const issues = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  return {
    status: passed >= 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    issues: issues.length > 0 ? issues : null,
    portsInitialized: portsSnapshot._initialized,
    metrics: m,
    version: VERSION,
    moduleId: MODULE_ID,
    timestampUtc: ts.timestampUtc,
    localTime: ts.localTime,
    timeZone: ts.timeZone
  };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  const ts = _buildTimestamp();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    namespace: NAMESPACE,
    portsInitialized: portsSnapshot._initialized,
    config: { ...CONFIG },
    metrics: getMetrics(),
    healthCheck: healthCheck(),
    timestampUtc: ts.timestampUtc,
    localTime: ts.localTime,
    timeZone: ts.timeZone
  };
}
const ErrorTelemetry = {
  trackErrorEvent,
  getEventLog,
  clearEventLog,
  getRecentEvents,
  getMetrics,
  configure,
  resetMetrics,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
var tracker_default = trackErrorEvent;
export {
  ErrorTelemetry,
  MODULE_ID,
  NAMESPACE,
  VERSION,
  clearEventLog,
  configure,
  tracker_default as default,
  getEventLog,
  getMetrics,
  getPorts,
  getRecentEvents,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  trackErrorEvent
};
