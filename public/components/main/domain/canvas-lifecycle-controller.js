const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "canvas-lifecycle-controller";
let _canvases = /* @__PURE__ */ new Map();
let _activeCanvas = null;
let _metrics = { created: 0, destroyed: 0, activations: 0, errors: 0 };
function create(canvasId, options = {}) {
  try {
    const canvas = { id: canvasId, ...options, createdAt: Date.now(), state: "created" };
    _canvases.set(canvasId, canvas);
    _metrics.created++;
    return canvas;
  } catch (error) {
    _metrics.errors++;
    return null;
  }
}
function destroy(canvasId) {
  const result = _canvases.delete(canvasId);
  if (result) {
    _metrics.destroyed++;
    if (_activeCanvas === canvasId) _activeCanvas = null;
  }
  return result;
}
function activate(canvasId) {
  if (_canvases.has(canvasId)) {
    _activeCanvas = canvasId;
    _metrics.activations++;
    return true;
  }
  return false;
}
function getActive() {
  return _activeCanvas;
}
function get(canvasId) {
  return _canvases.get(canvasId) || null;
}
function getAll() {
  return Object.fromEntries(_canvases);
}
function clear() {
  _canvases.clear();
  _activeCanvas = null;
}
function getMetrics() {
  return { ..._metrics, count: _canvases.size, active: _activeCanvas };
}
function healthCheck() {
  return {
    status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { canvasCount: _canvases.size, hasActive: !!_activeCanvas, noErrors: _metrics.errors === 0 },
    metrics: getMetrics()
  };
}
var canvas_lifecycle_controller_default = { create, destroy, activate, getActive, get, getAll, clear, getMetrics, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  activate,
  clear,
  create,
  canvas_lifecycle_controller_default as default,
  destroy,
  get,
  getActive,
  getAll,
  getMetrics,
  healthCheck
};
