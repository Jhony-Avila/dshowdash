import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.status-version";
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
const _state = { initialized: false, appVersion: "3.0.0", buildDate: null, environment: "production" };
const _metrics = { checks: 0 };
function setVersion(version) {
  _state.appVersion = version;
  return { ok: true };
}
function getVersion() {
  return _state.appVersion;
}
function setBuildDate(date) {
  _state.buildDate = date;
  return { ok: true };
}
function getBuildDate() {
  return _state.buildDate;
}
function setEnvironment(env) {
  _state.environment = env;
  return { ok: true };
}
function getEnvironment() {
  return _state.environment;
}
function getVersionInfo() {
  _metrics.checks++;
  return { version: _state.appVersion, buildDate: _state.buildDate, environment: _state.environment };
}
function render() {
  return `<span class="footer-version">v${_state.appVersion}</span>`;
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.version) _state.appVersion = ctx.version;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, appVersion: _state.appVersion, environment: _state.environment, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var status_version_default = { MODULE_ID, VERSION, init, setVersion, getVersion, setBuildDate, getBuildDate, setEnvironment, getEnvironment, getVersionInfo, render, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  status_version_default as default,
  getBuildDate,
  getEnvironment,
  getPorts,
  getVersion,
  getVersionInfo,
  healthCheck,
  info,
  init,
  injectPorts,
  render,
  setBuildDate,
  setEnvironment,
  setVersion
};
