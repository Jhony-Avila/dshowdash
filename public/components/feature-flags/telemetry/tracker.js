import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "2.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.feature-flags.telemetry.tracker";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _metrics = {
  events: 0,
  evaluations: 0,
  errors: 0,
  lastEventAt: null
};
function track(event, data = {}) {
  _metrics.events++;
  _metrics.lastEventAt = Date.now();
  if (event.includes("error")) _metrics.errors++;
  if (event.includes("eval")) _metrics.evaluations++;
  const eventBus = _getPort("eventBus");
  if (eventBus?.emit) {
    eventBus.emit(TELEMETRY_INTENTS.TRACK, {
      source: MODULE_ID,
      event,
      data,
      timestamp: Date.now()
    });
  }
}
const trackFlagEvent = track;
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics.events = 0;
  _metrics.evaluations = 0;
  _metrics.errors = 0;
  _metrics.lastEventAt = null;
}
function getEventLog() {
  return [];
}
function getRecentEvents() {
  return [];
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const checks = {
    hasMetrics: true,
    lowErrorRate: _metrics.events === 0 || _metrics.errors / _metrics.events < 0.2,
    portsInitialized: portsSnapshot._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    portsInitialized: portsSnapshot._initialized,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now(),
    p18IntentsAvailable: true
  };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    portsInitialized: portsSnapshot._initialized,
    healthCheck: healthCheck(),
    timestamp: Date.now(),
    usingP18Intents: true
  };
}
var tracker_default = {
  track,
  trackFlagEvent,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  getEventLog,
  getRecentEvents,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getEventLog,
  getMetrics,
  getPorts,
  getRecentEvents,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  track,
  trackFlagEvent
};
