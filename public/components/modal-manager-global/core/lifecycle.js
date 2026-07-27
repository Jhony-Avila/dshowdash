import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const MODULE_ID = "components.modal-manager-global.core.lifecycle";
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
const PHASES = { IDLE: "idle", OPENING: "opening", OPEN: "open", CLOSING: "closing" };
const _state = { initialized: false, phase: PHASES.IDLE };
let _cleanups = [];
const _metrics = { opens: 0, closes: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function setPhase(phase) {
  _state.phase = phase;
  _emit(UI_EVENTS.MODAL_LIFECYCLE_PHASE, { phase });
  return { ok: true, phase };
}
function getPhase() {
  return _state.phase;
}
function open(config) {
  _metrics.opens++;
  setPhase(PHASES.OPENING);
  _emit(UI_EVENTS.MODAL_OPENING, config);
  setTimeout(() => {
    setPhase(PHASES.OPEN);
    _emit(UI_EVENTS.MODAL_OPENED, config);
  }, 0);
  return { ok: true };
}
function close(id) {
  _metrics.closes++;
  setPhase(PHASES.CLOSING);
  _emit(UI_EVENTS.MODAL_CLOSING, { id });
  setTimeout(() => {
    setPhase(PHASES.IDLE);
    _emit(UI_EVENTS.MODAL_CLOSED, { id });
  }, 0);
  return { ok: true };
}
function registerCleanup(fn) {
  if (typeof fn === "function") _cleanups.push(fn);
  return () => {
    const idx = _cleanups.indexOf(fn);
    if (idx >= 0) _cleanups.splice(idx, 1);
  };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      _cleanups[i]();
    } catch (e) {
    }
  }
  _cleanups = [];
  _state.phase = PHASES.IDLE;
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, isIdle: { ok: _state.phase === PHASES.IDLE, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, phase: _state.phase, cleanupsCount: _cleanups.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var lifecycle_default = { MODULE_ID, VERSION, PHASES, init, cleanup, open, close, setPhase, getPhase, registerCleanup, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  PHASES,
  VERSION,
  cleanup,
  close,
  lifecycle_default as default,
  getPhase,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  open,
  registerCleanup,
  setPhase
};
