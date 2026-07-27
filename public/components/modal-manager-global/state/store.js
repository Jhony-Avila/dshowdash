import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.modal-manager-global.state.store";
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
const _state = { initialized: false, modals: [], activeModal: null, maxStack: 10 };
let _subscribers = [];
const _metrics = { opens: 0, closes: 0, notifications: 0 };
function _notify() {
  _metrics.notifications++;
  const snapshot = getState();
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](snapshot);
    } catch (e) {
    }
  }
}
function getState() {
  return { modals: _state.modals.slice(), activeModal: _state.activeModal, stackSize: _state.modals.length };
}
function pushModal(modal) {
  _metrics.opens++;
  if (_state.modals.length >= _state.maxStack) return { ok: false, reason: "Max stack reached" };
  const entry = Object.assign({ id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, openedAt: Date.now() }, modal);
  _state.modals.push(entry);
  _state.activeModal = entry.id;
  _notify();
  return { ok: true, id: entry.id };
}
function popModal(id) {
  if (_state.modals.length === 0) return { ok: false, reason: "No modals" };
  _metrics.closes++;
  const modal = _state.modals.pop();
  _state.activeModal = _state.modals.length > 0 ? _state.modals[_state.modals.length - 1].id : null;
  _notify();
  return { ok: true, modal };
}
function closeModal(id) {
  const idx = _state.modals.findIndex((m) => m.id === id);
  if (idx < 0) return { ok: false, reason: "Not found" };
  _metrics.closes++;
  const modal = _state.modals.splice(idx, 1)[0];
  _state.activeModal = _state.modals.length > 0 ? _state.modals[_state.modals.length - 1].id : null;
  _notify();
  return { ok: true, modal };
}
function closeAll() {
  const count = _state.modals.length;
  _metrics.closes += count;
  _state.modals = [];
  _state.activeModal = null;
  _notify();
  return { ok: true, closed: count };
}
function getActiveModal() {
  if (!_state.activeModal) return null;
  return _state.modals.find((m) => m.id === _state.activeModal) || null;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.maxStack) _state.maxStack = ctx.maxStack;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.modals = [];
  _state.activeModal = null;
  _subscribers = [];
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, stackNotFull: { ok: _state.modals.length < _state.maxStack, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, stackSize: _state.modals.length, maxStack: _state.maxStack, activeModal: _state.activeModal, subscribersCount: _subscribers.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var store_default = { MODULE_ID, VERSION, init, cleanup, getState, pushModal, popModal, closeModal, closeAll, getActiveModal, subscribe, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  closeAll,
  closeModal,
  store_default as default,
  getActiveModal,
  getPorts,
  getState,
  healthCheck,
  info,
  init,
  injectPorts,
  popModal,
  pushModal,
  subscribe
};
