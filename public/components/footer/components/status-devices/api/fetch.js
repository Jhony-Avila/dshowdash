import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.status-devices.api.fetch";
const VERSION = "2.1.1-P17WI";
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
const _metrics = { fetches: 0 };
function fetchDeviceConfig() {
  _metrics.fetches++;
  return Promise.resolve({ ok: true, config: { monitoredDevices: ["camera", "microphone"], checkInterval: 3e4 } });
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function destroy() {
}
var fetch_default = { MODULE_ID, VERSION, init, fetchDeviceConfig, healthCheck, info, injectPorts, getPorts, destroy };
export {
  MODULE_ID,
  VERSION,
  fetch_default as default,
  fetchDeviceConfig,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts
};
