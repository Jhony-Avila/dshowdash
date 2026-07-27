import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.charts.executions-timeline";
const VERSION = "2.2.0-P18EC";
const TIMELINE_TELEMETRY = {
  INIT: "chart:timeline:init",
  RENDER: "chart:timeline:render"
};
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
const _state = { initialized: false, data: [], container: null, chart: null };
const _metrics = { renders: 0, updates: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function setData(data) {
  _state.data = data || [];
  return { ok: true, count: _state.data.length };
}
function getData() {
  return _state.data.slice();
}
function render(container) {
  _metrics.renders++;
  _state.container = container || _state.container;
  if (!_state.container) return { ok: false, reason: "No container" };
  _track(TIMELINE_TELEMETRY.RENDER, { dataPoints: _state.data.length });
  return { ok: true };
}
function update(newData) {
  _metrics.updates++;
  if (newData) _state.data = newData;
  return render();
}
function destroy() {
  _state.chart = null;
  _state.data = [];
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.container) _state.container = ctx.container;
  if (ctx && ctx.data) _state.data = ctx.data;
  _state.initialized = true;
  _track(TIMELINE_TELEMETRY.INIT, { version: VERSION });
  return { ok: true, version: VERSION };
}
function cleanup() {
  destroy();
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, hasContainer: { ok: !!_state.container, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, dataPoints: _state.data.length, hasContainer: !!_state.container, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var executions_timeline_default = { MODULE_ID, VERSION, TIMELINE_TELEMETRY, init, cleanup, setData, getData, render, update, destroy, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  TIMELINE_TELEMETRY,
  VERSION,
  cleanup,
  executions_timeline_default as default,
  destroy,
  getData,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  render,
  setData,
  update
};
