import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.main.adapters.telemetry";
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
function track(eventName, payload = {}) {
  _metrics.tracked++;
  const telemetry = _getPort("telemetry");
  if (telemetry && telemetry.track) {
    telemetry.track(eventName, Object.assign({ adapter: "main", timestamp: Date.now() }, payload || {}));
    return { ok: true };
  }
  return { ok: false, reason: "Telemetry not available" };
}
function trackError(error, context = {}) {
  _metrics.errors++;
  return track("main:adapter:error", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : void 0, context });
}
function trackTiming(name, durationMs) {
  return track("main:timing", { name, durationMs });
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  const hasTelemetry = !!_getPort("telemetry");
  return { status: hasTelemetry ? "HEALTHY" : "DEGRADED", score: hasTelemetry ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasTelemetry: { ok: hasTelemetry, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createTelemetryAdapter(options) {
  options = options || {};
  init(options);
  return { track, trackError, trackTiming, healthCheck, info, VERSION, MODULE_ID };
}
var TelemetryAdapter_default = { MODULE_ID, VERSION, createTelemetryAdapter, init, track, trackError, trackTiming, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createTelemetryAdapter,
  TelemetryAdapter_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  track,
  trackError,
  trackTiming
};
