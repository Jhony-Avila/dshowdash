const MODULE_ID = "panel-health-dashboard.telemetry-helper";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_NAME = "panel-health-dashboard";
function track(eventName, data = {}) {
  const payload = {
    panel: PANEL_NAME,
    event: eventName,
    timestamp: Date.now(),
    ...data
  };
  if (window.TelemetryService?.track) {
    window.TelemetryService.track(payload);
  }
}
function trackMetricFetch(metricName, duration) {
  track("metric_fetch", { metricName, duration });
}
function trackHealthCheck(status, details = {}) {
  track("health_check", { status, ...details });
}
function trackRefresh(success, duration) {
  track("refresh", { success, duration });
}
function createTelemetry(namespace) {
  const scope = namespace || PANEL_NAME;
  return {
    track: (eventName, data = {}) => track(eventName, { scope, ...data }),
    trackMetricFetch: (metricName, duration) => trackMetricFetch(metricName, duration),
    trackHealthCheck: (status, details = {}) => trackHealthCheck(status, details),
    trackRefresh: (success, duration) => trackRefresh(success, duration)
  };
}
var telemetry_helper_default = { track, trackMetricFetch, trackHealthCheck, trackRefresh, createTelemetry };
export {
  MODULE_ID,
  VERSION,
  createTelemetry,
  telemetry_helper_default as default,
  track,
  trackHealthCheck,
  trackMetricFetch,
  trackRefresh
};
