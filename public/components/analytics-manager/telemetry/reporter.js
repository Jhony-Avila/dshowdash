import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.analytics-manager.telemetry.reporter";
const COMPONENT_NAME = "analytics-manager";
const hasWindow = typeof window !== "undefined";
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
const eventLog = [];
const maxLogSize = 500;
const _metrics = {
  trackCount: 0,
  successCount: 0,
  failCount: 0,
  lastTrackAt: null
};
const trackAnalyticsEvent = (eventName, data = {}) => {
  _metrics.trackCount++;
  _metrics.lastTrackAt = Date.now();
  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    component: COMPONENT_NAME,
    event: eventName,
    data
  };
  eventLog.push(event);
  if (eventLog.length > maxLogSize) {
    eventLog.shift();
  }
  const t = _getPort("telemetry");
  if (t?.track) {
    try {
      t.track(eventName, { component: COMPONENT_NAME, moduleId: MODULE_ID, ...data });
      _metrics.successCount++;
    } catch (err) {
      _metrics.failCount++;
    }
  }
  return event;
};
const trackAnalyticsMetric = (metricName, value, tags = {}) => trackAnalyticsEvent("analytics:metric", { metricName, value, tags, type: "metric" });
const trackAnalyticsError = (errorType, errorMessage, context = {}) => trackAnalyticsEvent("analytics:error", { errorType, errorMessage, context, type: "error" });
const getEventLog = () => [...eventLog];
const clearEventLog = () => {
  eventLog.length = 0;
  trackAnalyticsEvent("analytics:log:cleared");
};
const getRecentEvents = (count = 10) => eventLog.slice(-count);
const getEventsByType = (eventName) => eventLog.filter((e) => e.event === eventName);
const getVersion = () => VERSION;
const getMetrics = () => ({ ..._metrics });
const resetMetrics = () => {
  _metrics.trackCount = 0;
  _metrics.successCount = 0;
  _metrics.failCount = 0;
  _metrics.lastTrackAt = null;
};
const healthCheck = () => {
  const ps = Ports.snapshot();
  const t = _getPort("telemetry");
  const telemetryAvailable = !!t?.track;
  const successRate = _metrics.trackCount > 0 ? _metrics.successCount / _metrics.trackCount : 1;
  const bufferHealthy = eventLog.length < maxLogSize * 0.9;
  const checks = {
    telemetryAvailable,
    bufferHealthy,
    highSuccessRate: successRate > 0.8,
    hasRecentActivity: _metrics.lastTrackAt ? Date.now() - _metrics.lastTrackAt < 3e5 : true,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: {
      trackCount: _metrics.trackCount,
      successCount: _metrics.successCount,
      failCount: _metrics.failCount,
      successRate: successRate.toFixed(2),
      bufferSize: eventLog.length,
      maxBufferSize: maxLogSize
    },
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
};
const info = () => {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    component: COMPONENT_NAME,
    telemetryAvailable: !!_getPort("telemetry")?.track,
    bufferSize: eventLog.length,
    maxBufferSize: maxLogSize,
    metrics: getMetrics(),
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
};
var reporter_default = trackAnalyticsEvent;
export {
  MODULE_ID,
  VERSION,
  clearEventLog,
  reporter_default as default,
  getEventLog,
  getEventsByType,
  getMetrics,
  getPorts,
  getRecentEvents,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  resetMetrics,
  trackAnalyticsError,
  trackAnalyticsEvent,
  trackAnalyticsMetric
};
