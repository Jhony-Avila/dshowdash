import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.navigation.preload";
const VERSION = "2.2.0-P18EC";
const PRELOAD_TELEMETRY = {
  SUCCESS: "router:preload:success"
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
const _state = { initialized: false, preloaded: {}, loading: {}, enabled: true };
const _metrics = { preloads: 0, hits: 0, misses: 0, errors: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function preload(path, loader) {
  if (!_state.enabled) return Promise.resolve({ ok: false, reason: "Disabled" });
  if (_state.preloaded[path]) {
    _metrics.hits++;
    return Promise.resolve({ ok: true, cached: true, data: _state.preloaded[path] });
  }
  if (_state.loading[path]) return _state.loading[path];
  _metrics.preloads++;
  _state.loading[path] = new Promise((resolve) => {
    try {
      const result = typeof loader === "function" ? loader(path) : Promise.resolve(loader);
      Promise.resolve(result).then((data) => {
        _state.preloaded[path] = { data, timestamp: Date.now() };
        delete _state.loading[path];
        _track(PRELOAD_TELEMETRY.SUCCESS, { path });
        resolve({ ok: true, data });
      }).catch((err) => {
        delete _state.loading[path];
        _metrics.errors++;
        resolve({ ok: false, error: err.message });
      });
    } catch (e) {
      delete _state.loading[path];
      _metrics.errors++;
      resolve({ ok: false, error: e.message });
    }
  });
  return _state.loading[path];
}
function getPreloaded(path) {
  if (_state.preloaded[path]) {
    _metrics.hits++;
    return _state.preloaded[path].data;
  }
  _metrics.misses++;
  return null;
}
function isPreloaded(path) {
  return !!_state.preloaded[path];
}
function clearPreloaded(path) {
  if (path) delete _state.preloaded[path];
  else _state.preloaded = {};
  return { ok: true };
}
function setEnabled(enabled) {
  _state.enabled = enabled;
}
function isEnabled() {
  return _state.enabled;
}
function preloadOnHover(element, path, loader) {
  if (!element || typeof document === "undefined") return () => {
  };
  const preloadFn = () => {
    preload(path, loader);
  };
  element.addEventListener("mouseenter", preloadFn);
  element.addEventListener("focus", preloadFn);
  return () => {
    element.removeEventListener("mouseenter", preloadFn);
    element.removeEventListener("focus", preloadFn);
  };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.enabled !== void 0) _state.enabled = ctx.enabled;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.preloaded = {};
  _state.loading = {};
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, enabled: { ok: _state.enabled, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, enabled: _state.enabled, preloadedCount: Object.keys(_state.preloaded).length, loadingCount: Object.keys(_state.loading).length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var preload_default = { MODULE_ID, VERSION, PRELOAD_TELEMETRY, init, cleanup, preload, getPreloaded, isPreloaded, clearPreloaded, setEnabled, isEnabled, preloadOnHover, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  PRELOAD_TELEMETRY,
  VERSION,
  cleanup,
  clearPreloaded,
  preload_default as default,
  getPorts,
  getPreloaded,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled,
  isPreloaded,
  preload,
  preloadOnHover,
  setEnabled
};
