import { PERSISTENCE_EVENTS } from "/core/runtime/events/catalog/persistence.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.main.domain.action-hub";
const VERSION = "2.4.0-P18EC";
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
const _state = { initialized: false, actions: {}, history: [], maxHistory: 50 };
const _metrics = { registered: 0, executed: 0, errors: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function _track(eventName, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function registerAction(actionId, handler, options) {
  _metrics.registered++;
  options = options || {};
  _state.actions[actionId] = { handler, description: options.description || "", permissions: options.permissions || [], registeredAt: Date.now() };
  _track("action-hub:registered", { actionId });
  return { ok: true, actionId };
}
function unregisterAction(actionId) {
  if (_state.actions[actionId]) {
    delete _state.actions[actionId];
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function execute(actionId, payload) {
  const action = _state.actions[actionId];
  if (!action) {
    _metrics.errors++;
    return Promise.reject(new Error(`Action not found: ${actionId}`));
  }
  const startTime = Date.now();
  _emit(PERSISTENCE_EVENTS.ACTION_HUB_EXECUTING, { actionId, payload });
  return Promise.resolve().then(() => action.handler(payload)).then((result) => {
    const latency = Date.now() - startTime;
    _metrics.executed++;
    _state.history.unshift({ actionId, payload, result, latency, timestamp: startTime });
    if (_state.history.length > _state.maxHistory) _state.history.pop();
    _emit(PERSISTENCE_EVENTS.ACTION_HUB_EXECUTED, { actionId, latency });
    _track("action-hub:executed", { actionId, latency });
    return { ok: true, result, latency };
  }).catch((error) => {
    _metrics.errors++;
    _emit(PERSISTENCE_EVENTS.ACTION_HUB_ERROR, { actionId, error: error.message });
    _track("action-hub:error", { actionId, error: error.message });
    throw error;
  });
}
function getAction(actionId) {
  return _state.actions[actionId] || null;
}
function listActions() {
  return Object.keys(_state.actions).map((id) => ({
    id,
    description: _state.actions[id].description
  }));
}
function getHistory(limit) {
  return _state.history.slice(0, limit || 20);
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  _track("action-hub:init", { version: VERSION });
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.actions = {};
  _state.history = [];
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, actionsCount: Object.keys(_state.actions).length, historySize: _state.history.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createActionHub(options) {
  options = options || {};
  const _options = options;
  return {
    init() {
      return init(_options);
    },
    registerAction,
    unregisterAction,
    execute,
    getAction,
    listActions,
    getHistory,
    cleanup,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
  };
}
var action_hub_default = { MODULE_ID, VERSION, createActionHub, init, cleanup, registerAction, unregisterAction, execute, getAction, listActions, getHistory, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  createActionHub,
  action_hub_default as default,
  execute,
  getAction,
  getHistory,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  listActions,
  registerAction,
  unregisterAction
};
