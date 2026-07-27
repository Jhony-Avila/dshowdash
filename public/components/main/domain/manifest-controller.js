import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.main.domain.manifest-controller";
const VERSION = "8.0.0-UNIFIED";
const MANIFEST_TELEMETRY = {
  REGISTERED: "manifest:registered",
  LOADED: "manifest:loaded"
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
const _state = { initialized: false, manifests: {}, loaded: [] };
const _metrics = { registered: 0, loaded: 0, errors: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function registerManifest(id, manifest) {
  _metrics.registered++;
  _state.manifests[id] = Object.assign({ id, registeredAt: Date.now() }, manifest);
  _track(MANIFEST_TELEMETRY.REGISTERED, { id });
  return { ok: true, id };
}
function getManifest(id) {
  return _state.manifests[id] || null;
}
function getAllManifests() {
  return Object.assign({}, _state.manifests);
}
function listManifests() {
  return Object.keys(_state.manifests);
}
function loadManifest(id) {
  if (id === void 0 || id === null) {
    _metrics.loaded++;
    _track(MANIFEST_TELEMETRY.LOADED, { id: "default-init" });
    return Promise.resolve({ ok: true, manifest: null, noManifestRequired: true });
  }
  const manifest = _state.manifests[id];
  if (!manifest) {
    _metrics.errors++;
    return Promise.reject(new Error(`Manifest not found: ${id}`));
  }
  _metrics.loaded++;
  if (_state.loaded.indexOf(id) < 0) _state.loaded.push(id);
  _track(MANIFEST_TELEMETRY.LOADED, { id });
  return Promise.resolve({ ok: true, manifest });
}
function isLoaded(id) {
  return _state.loaded.indexOf(id) >= 0;
}
function getLoadedManifests() {
  return _state.loaded.slice();
}
function unregisterManifest(id) {
  if (_state.manifests[id]) {
    delete _state.manifests[id];
    const idx = _state.loaded.indexOf(id);
    if (idx >= 0) _state.loaded.splice(idx, 1);
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.manifests = {};
  _state.loaded = [];
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, manifestsCount: Object.keys(_state.manifests).length, loadedCount: _state.loaded.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createManifestController(options) {
  options = options || {};
  init(options);
  return {
    registerManifest,
    getManifest,
    getAllManifests,
    listManifests,
    loadManifest,
    isLoaded,
    getLoadedManifests,
    unregisterManifest,
    cleanup,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
  };
}
var manifest_controller_default = { MODULE_ID, VERSION, MANIFEST_TELEMETRY, createManifestController, init, cleanup, registerManifest, getManifest, getAllManifests, listManifests, loadManifest, isLoaded, getLoadedManifests, unregisterManifest, healthCheck, info, injectPorts, getPorts };
export {
  MANIFEST_TELEMETRY,
  MODULE_ID,
  VERSION,
  cleanup,
  createManifestController,
  manifest_controller_default as default,
  getAllManifests,
  getLoadedManifests,
  getManifest,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isLoaded,
  listManifests,
  loadManifest,
  registerManifest,
  unregisterManifest
};
