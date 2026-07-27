import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.charts.performance-comparison";
const VERSION = "2.2.0-P18EC";
const COMPARISON_TELEMETRY = {
  INIT: "chart:comparison:init",
  RENDER: "chart:comparison:render"
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
const _state = { initialized: false, datasets: [], container: null, chart: null };
const _metrics = { renders: 0, updates: 0, comparisons: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function addDataset(label, data) {
  _state.datasets.push({ label, data, addedAt: Date.now() });
  return { ok: true, count: _state.datasets.length };
}
function clearDatasets() {
  _state.datasets = [];
  return { ok: true };
}
function getDatasets() {
  return _state.datasets.slice();
}
function render(container) {
  _metrics.renders++;
  _state.container = container || _state.container;
  if (!_state.container) return { ok: false, reason: "No container" };
  _track(COMPARISON_TELEMETRY.RENDER, { datasets: _state.datasets.length });
  return { ok: true };
}
function compare(dataset1, dataset2) {
  _metrics.comparisons++;
  const d1 = _state.datasets.find((d) => d.label === dataset1);
  const d2 = _state.datasets.find((d) => d.label === dataset2);
  if (!d1 || !d2) return { ok: false, reason: "Dataset not found" };
  const avg1 = d1.data.reduce((a, b) => a + b, 0) / d1.data.length;
  const avg2 = d2.data.reduce((a, b) => a + b, 0) / d2.data.length;
  return { ok: true, dataset1: { label: d1.label, avg: avg1 }, dataset2: { label: d2.label, avg: avg2 }, difference: avg1 - avg2, percentDiff: `${((avg1 - avg2) / avg2 * 100).toFixed(2)}%` };
}
function destroy() {
  _state.chart = null;
  _state.datasets = [];
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.container) _state.container = ctx.container;
  _state.initialized = true;
  _track(COMPARISON_TELEMETRY.INIT, { version: VERSION });
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
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, datasetsCount: _state.datasets.length, hasContainer: !!_state.container, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var performance_comparison_default = { MODULE_ID, VERSION, COMPARISON_TELEMETRY, init, cleanup, addDataset, clearDatasets, getDatasets, render, compare, destroy, healthCheck, info, injectPorts, getPorts };
export {
  COMPARISON_TELEMETRY,
  MODULE_ID,
  VERSION,
  addDataset,
  cleanup,
  clearDatasets,
  compare,
  performance_comparison_default as default,
  destroy,
  getDatasets,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  render
};
