import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-08.telemetry.tracker";
const VERSION = "9.3.0-P2-ENTERPRISE";
const NAMESPACE = "panel-08";
const TRACKER_EVENTS = Object.freeze({
  MOUNT_SUCCESS: `telemetry:${NAMESPACE}:mount:success`,
  UNMOUNT: `telemetry:${NAMESPACE}:unmount`,
  REFRESH_START: `telemetry:${NAMESPACE}:refresh:start`,
  REFRESH_SUCCESS: `telemetry:${NAMESPACE}:refresh:success`,
  REFRESH_ERROR: `telemetry:${NAMESPACE}:refresh:error`,
  ALERT_ACKNOWLEDGED: `telemetry:${NAMESPACE}:alert:acknowledged`
});
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const metrics = { eventsTracked: 0, refreshCount: 0, errors: 0, acknowledgeCount: 0, sessionStart: Date.now() };
const _emit = (event, data) => {
  const eb = _getPort("eventBus");
  if (eb?.emit) {
    eb.emit(event, { ...data || {}, source: MODULE_ID, timestamp: Date.now() });
  }
};
const trackMountSuccess = (duration) => {
  metrics.eventsTracked++;
  _emit(TRACKER_EVENTS.MOUNT_SUCCESS, { duration });
};
const trackUnmount = () => {
  metrics.eventsTracked++;
  _emit(TRACKER_EVENTS.UNMOUNT, { uptime: Date.now() - metrics.sessionStart });
};
const trackRefreshStart = () => {
  metrics.eventsTracked++;
  metrics.refreshCount++;
  _emit(TRACKER_EVENTS.REFRESH_START, {});
};
const trackRefreshSuccess = (alertCount, duration) => {
  metrics.eventsTracked++;
  _emit(TRACKER_EVENTS.REFRESH_SUCCESS, { alertCount, duration });
};
const trackRefreshError = (error) => {
  metrics.eventsTracked++;
  metrics.errors++;
  _emit(TRACKER_EVENTS.REFRESH_ERROR, { error: error?.message || String(error) });
};
const trackAlertAcknowledged = (alertId, alertType) => {
  metrics.eventsTracked++;
  metrics.acknowledgeCount++;
  _emit(TRACKER_EVENTS.ALERT_ACKNOWLEDGED, { alertId, alertType });
};
const getMetrics = () => ({ ...metrics, uptime: Date.now() - metrics.sessionStart });
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() });
var tracker_default = { trackMountSuccess, trackUnmount, trackRefreshStart, trackRefreshSuccess, trackRefreshError, trackAlertAcknowledged, getMetrics, info, healthCheck, TRACKER_EVENTS, MODULE_ID, VERSION, injectPorts, getPorts };
export {
  MODULE_ID,
  TRACKER_EVENTS,
  VERSION,
  tracker_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  trackAlertAcknowledged,
  trackMountSuccess,
  trackRefreshError,
  trackRefreshStart,
  trackRefreshSuccess,
  trackUnmount
};
