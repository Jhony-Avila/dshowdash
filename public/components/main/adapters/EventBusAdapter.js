import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.main.adapters.eventbus";
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
let _cleanups = [];
const _metrics = { subscribed: 0, emitted: 0 };
function on(event, handler) {
  _metrics.subscribed++;
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const cleanup2 = eb.on(event, handler);
    _cleanups.push(cleanup2);
    return cleanup2;
  }
  return () => {
  };
}
function emit(event, data) {
  _metrics.emitted++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(event, Object.assign({ source: "main-adapter" }, data || {}));
    return { ok: true };
  }
  return { ok: false, reason: "EventBus not available" };
}
function once(event, handler) {
  let cleanup2;
  const wrappedHandler = (data) => {
    if (cleanup2 && typeof cleanup2 === "function") cleanup2();
    handler(data);
  };
  cleanup2 = on(event, wrappedHandler);
  return cleanup2;
}
function cleanup() {
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      if (typeof _cleanups[i] === "function") _cleanups[i]();
    } catch (e) {
    }
  }
  _cleanups = [];
  return { ok: true };
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  const hasEventBus = !!_getPort("eventBus");
  return { status: hasEventBus ? "HEALTHY" : "DEGRADED", score: hasEventBus ? 100 : 50, moduleId: MODULE_ID, version: VERSION, checks: { hasEventBus: { ok: hasEventBus, severity: "crit" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, activeSubscriptions: _cleanups.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function createEventBusAdapter(options) {
  options = options || {};
  init(options);
  return { on, emit, once, cleanup, healthCheck, info, VERSION, MODULE_ID };
}
var EventBusAdapter_default = { MODULE_ID, VERSION, createEventBusAdapter, init, on, emit, once, cleanup, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  createEventBusAdapter,
  EventBusAdapter_default as default,
  emit,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  on,
  once
};
