import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.table-engine.core.worker-manager";
const VERSION = "2.2.0-P18EC";
const WORKER_TELEMETRY = {
  CREATED: "table:worker:created",
  TERMINATED: "table:worker:terminated"
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
const _state = { initialized: false, workers: {}, maxWorkers: 4 };
const _metrics = { created: 0, terminated: 0, tasks: 0, errors: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function createWorker(id, scriptUrl) {
  if (typeof Worker === "undefined") return { ok: false, reason: "Workers not supported" };
  if (Object.keys(_state.workers).length >= _state.maxWorkers) return { ok: false, reason: "Max workers reached" };
  try {
    const worker = new Worker(scriptUrl);
    _state.workers[id] = { worker, createdAt: Date.now(), tasks: 0 };
    _metrics.created++;
    _track(WORKER_TELEMETRY.CREATED, { id });
    return { ok: true, id };
  } catch (e) {
    _metrics.errors++;
    return { ok: false, error: e.message };
  }
}
function terminateWorker(id) {
  if (_state.workers[id]) {
    _state.workers[id].worker.terminate();
    delete _state.workers[id];
    _metrics.terminated++;
    _track(WORKER_TELEMETRY.TERMINATED, { id });
    return { ok: true };
  }
  return { ok: false, reason: "Worker not found" };
}
function postMessage(id, message) {
  if (!_state.workers[id]) return { ok: false, reason: "Worker not found" };
  _state.workers[id].worker.postMessage(message);
  _state.workers[id].tasks++;
  _metrics.tasks++;
  return { ok: true };
}
function onMessage(id, handler) {
  if (!_state.workers[id]) return () => {
  };
  _state.workers[id].worker.onmessage = (e) => {
    handler(e.data);
  };
  return () => {
    if (_state.workers[id]) _state.workers[id].worker.onmessage = null;
  };
}
function getWorker(id) {
  return _state.workers[id] || null;
}
function listWorkers() {
  return Object.keys(_state.workers);
}
function terminateAll() {
  for (const id in _state.workers) {
    terminateWorker(id);
  }
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.maxWorkers) _state.maxWorkers = ctx.maxWorkers;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  terminateAll();
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, workersSupported: { ok: typeof Worker !== "undefined", severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, activeWorkers: Object.keys(_state.workers).length, maxWorkers: _state.maxWorkers, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var worker_manager_default = { MODULE_ID, VERSION, WORKER_TELEMETRY, init, cleanup, createWorker, terminateWorker, postMessage, onMessage, getWorker, listWorkers, terminateAll, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  WORKER_TELEMETRY,
  cleanup,
  createWorker,
  worker_manager_default as default,
  getPorts,
  getWorker,
  healthCheck,
  info,
  init,
  injectPorts,
  listWorkers,
  onMessage,
  postMessage,
  terminateAll,
  terminateWorker
};
