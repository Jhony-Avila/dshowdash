import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "2.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.accessibility-manager.telemetry.tracker";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _metrics = {
  events: 0,
  a11yChanges: 0,
  errors: 0,
  lastEventAt: null
};
const _eventLog = [];
const MAX_LOG_SIZE = 100;
function _addToLog(event, data) {
  _eventLog.push({
    event,
    data,
    timestamp: Date.now()
  });
  if (_eventLog.length > MAX_LOG_SIZE) {
    _eventLog.shift();
  }
}
function track(event, data = {}) {
  _metrics.events++;
  _metrics.lastEventAt = Date.now();
  if (event.indexOf("error") > -1) {
    _metrics.errors++;
  }
  if (event.indexOf("change") > -1) {
    _metrics.a11yChanges++;
  }
  _addToLog(event, data);
  const eb = Ports.get("eventBus");
  if (eb && eb.emit) {
    eb.emit(TELEMETRY_INTENTS.TRACK, {
      source: MODULE_ID,
      event,
      data,
      timestamp: Date.now()
    });
  }
}
function trackEvent(event, data) {
  track(event, data);
}
function trackError(event, error) {
  track(event, { error: error instanceof Error ? error.message : "unknown" });
}
function getMetrics() {
  return { ..._metrics };
}
function getStats() {
  return getMetrics();
}
function getEvents() {
  return [..._eventLog];
}
function resetMetrics() {
  _metrics.events = 0;
  _metrics.a11yChanges = 0;
  _metrics.errors = 0;
  _metrics.lastEventAt = null;
  _eventLog.length = 0;
}
function init(ctx) {
  Ports.init();
  if (ctx && ctx.ports) {
    Ports.inject(ctx.ports);
  }
  return { ok: true, version: VERSION };
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = {
    hasMetrics: !!_metrics,
    lowErrorRate: _metrics.events === 0 || _metrics.errors / _metrics.events < 0.2,
    portsInitialized: Ports.isInitialized()
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
    eventLogSize: _eventLog.length,
    p18IntentsAvailable: true,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics(),
    eventLogSize: _eventLog.length,
    usingP18Intents: true,
    timestamp: Date.now()
  };
}
var tracker_default = {
  track,
  trackEvent,
  trackError,
  getMetrics,
  getStats,
  getEvents,
  resetMetrics,
  init,
  healthCheck,
  info,
  getVersion,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  tracker_default as default,
  getEvents,
  getMetrics,
  getPorts,
  getStats,
  getVersion,
  healthCheck,
  info,
  init,
  injectPorts,
  resetMetrics,
  track,
  trackError,
  trackEvent
};
