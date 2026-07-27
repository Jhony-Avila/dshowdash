import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.table-engine.mixins.filters.presets";
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
const _state = { initialized: false, presets: {} };
const _metrics = { saved: 0, applied: 0, deleted: 0 };
function savePreset(name, filters) {
  _metrics.saved++;
  _state.presets[name] = { filters, savedAt: Date.now() };
  return { ok: true, name };
}
function getPreset(name) {
  return _state.presets[name] || null;
}
function listPresets() {
  return Object.keys(_state.presets).map((name) => ({
    name,
    savedAt: _state.presets[name].savedAt,
    filterCount: Object.keys(_state.presets[name].filters).length
  }));
}
function deletePreset(name) {
  if (_state.presets[name]) {
    delete _state.presets[name];
    _metrics.deleted++;
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function applyPreset(name, filterEngine) {
  const preset = _state.presets[name];
  if (!preset) return { ok: false, reason: "Preset not found" };
  _metrics.applied++;
  if (filterEngine && filterEngine.clearFilters) filterEngine.clearFilters();
  for (const column in preset.filters) {
    const filter = preset.filters[column];
    if (filterEngine && filterEngine.setFilter) filterEngine.setFilter(column, filter.operator, filter.value);
  }
  return { ok: true, filters: preset.filters };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.presets = {};
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, presetsCount: Object.keys(_state.presets).length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var presets_default = { MODULE_ID, VERSION, init, cleanup, savePreset, getPreset, listPresets, deletePreset, applyPreset, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  applyPreset,
  cleanup,
  presets_default as default,
  deletePreset,
  getPorts,
  getPreset,
  healthCheck,
  info,
  init,
  injectPorts,
  listPresets,
  savePreset
};
