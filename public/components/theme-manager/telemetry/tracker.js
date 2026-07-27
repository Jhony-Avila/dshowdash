import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "2.4.0-P18EC";
const MODULE_ID = "theme-manager-tracker";
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
const _metrics = { events: 0, themeChanges: 0, errors: 0, lastEventAt: null };
function track(event, data) {
  _initPorts();
  if (data === void 0) data = {};
  _metrics.events++;
  _metrics.lastEventAt = Date.now();
  if (event.indexOf("error") !== -1) _metrics.errors++;
  if (event.indexOf("change") !== -1) _metrics.themeChanges++;
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(TELEMETRY_INTENTS.TRACK, { source: MODULE_ID, event, data, timestamp: Date.now() });
  }
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics.events = 0;
  _metrics.themeChanges = 0;
  _metrics.errors = 0;
  _metrics.lastEventAt = null;
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const checks = { hasMetrics: true, lowErrorRate: _metrics.events === 0 || _metrics.errors / _metrics.events < 0.2, portsInitialized: portsSnapshot._initialized, p18IntentsAvailable: true };
  const values = Object.values(checks);
  const passed = values.filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: portsSnapshot._initialized, usingP18Intents: true, timestamp: Date.now() };
}
const trackThemeEvent = track;
const getEventLog = () => [];
const getRecentEvents = () => [];
var tracker_default = { track, trackThemeEvent, getMetrics, resetMetrics, healthCheck, info, getEventLog, getRecentEvents, injectPorts, getPorts, VERSION, MODULE_ID };
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
  trackThemeEvent
};
