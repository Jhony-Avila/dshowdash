import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.main.ports.telemetry";
const VERSION = "2.2.0-P18EC";
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
const _metrics = { tracked: 0, errors: 0 };
const _buffer = [];
const _maxBuffer = 100;
function track(eventName, payload = {}) {
  _metrics.tracked++;
  const telemetry = _getPort("telemetry");
  if (telemetry && telemetry.track) {
    telemetry.track(eventName, Object.assign({ source: "main", timestamp: Date.now() }, payload || {}));
    return { ok: true };
  }
  _buffer.push({ event: eventName, payload, timestamp: Date.now() });
  if (_buffer.length > _maxBuffer) _buffer.shift();
  return { ok: true, buffered: true };
}
function trackError(error, context = {}) {
  _metrics.errors++;
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : void 0;
  return track("main:error", { error: errorMsg, stack: errorStack, context });
}
function trackNavigation(from, to) {
  return track("main:navigation", { from, to });
}
function trackPanelLoad(panelId, loadTimeMs) {
  return track("main:panel:load", { panelId, loadTimeMs });
}
function flushBuffer() {
  const telemetry = _getPort("telemetry");
  if (!telemetry || !telemetry.track) return { ok: false, reason: "No telemetry" };
  let flushed = 0;
  while (_buffer.length > 0) {
    const entry = _buffer.shift();
    telemetry.track(entry.event, entry.payload);
    flushed++;
  }
  return { ok: true, flushed };
}
function getBuffer() {
  return _buffer.slice();
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  flushBuffer();
  return { ok: true, version: VERSION };
}
function healthCheck() {
  const hasTelemetry = !!_getPort("telemetry");
  return { status: hasTelemetry ? "HEALTHY" : "DEGRADED", score: hasTelemetry ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasTelemetry: { ok: hasTelemetry, severity: "warn" }, bufferSize: { ok: _buffer.length < _maxBuffer * 0.8, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, bufferSize: _buffer.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createTelemetryPort(options) {
  options = options || {};
  init(options);
  return { track, trackError, trackNavigation, trackPanelLoad, flushBuffer, getBuffer, healthCheck, info, VERSION, MODULE_ID };
}
var TelemetryPort_default = { MODULE_ID, VERSION, createTelemetryPort, init, track, trackError, trackNavigation, trackPanelLoad, flushBuffer, getBuffer, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createTelemetryPort,
  TelemetryPort_default as default,
  flushBuffer,
  getBuffer,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  track,
  trackError,
  trackNavigation,
  trackPanelLoad
};
