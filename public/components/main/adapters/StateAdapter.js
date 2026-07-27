import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.main.adapters.state";
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
const _localState = {};
const _metrics = { gets: 0, sets: 0, subscribes: 0 };
function get(key) {
  _metrics.gets++;
  const gs = _getPort("globalState");
  if (gs && gs.get) return gs.get(key);
  return _localState[key];
}
function set(key, value) {
  _metrics.sets++;
  const gs = _getPort("globalState");
  if (gs && gs.set) return gs.set(key, value);
  _localState[key] = value;
  return { ok: true, local: true };
}
function subscribe(key, handler) {
  _metrics.subscribes++;
  const gs = _getPort("globalState");
  if (gs && gs.subscribe) return gs.subscribe(key, handler);
  return () => {
  };
}
function getAll() {
  const gs = _getPort("globalState");
  if (gs && gs.getAll) return gs.getAll();
  return Object.assign({}, _localState);
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  const hasGlobalState = !!_getPort("globalState");
  return { status: hasGlobalState ? "HEALTHY" : "DEGRADED", score: hasGlobalState ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasGlobalState: { ok: hasGlobalState, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasGlobalState: !!_getPort("globalState"), localStateKeys: Object.keys(_localState).length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createStateAdapter(options) {
  options = options || {};
  init(options);
  return { get, set, subscribe, getAll, healthCheck, info, VERSION, MODULE_ID };
}
var StateAdapter_default = { MODULE_ID, VERSION, createStateAdapter, init, get, set, subscribe, getAll, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createStateAdapter,
  StateAdapter_default as default,
  get,
  getAll,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  set,
  subscribe
};
