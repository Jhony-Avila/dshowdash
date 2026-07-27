import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.navigation.transitions";
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
const _config = { enabled: true, duration: 200, type: "fade" };
const _metrics = { transitions: 0, skipped: 0 };
const TYPES = { FADE: "fade", SLIDE: "slide", NONE: "none" };
function setConfig(config) {
  Object.assign(_config, config);
  return { ok: true };
}
function getConfig() {
  return Object.assign({}, _config);
}
function beforeLeave(element) {
  if (!_config.enabled || !element) {
    _metrics.skipped++;
    return Promise.resolve();
  }
  _metrics.transitions++;
  return new Promise((resolve) => {
    element.style.transition = `opacity ${_config.duration}ms ease-out`;
    element.style.opacity = "0";
    setTimeout(resolve, _config.duration);
  });
}
function afterEnter(element) {
  if (!_config.enabled || !element) return Promise.resolve();
  return new Promise((resolve) => {
    element.style.opacity = "0";
    element.style.transition = `opacity ${_config.duration}ms ease-in`;
    requestAnimationFrame(() => {
      element.style.opacity = "1";
      setTimeout(() => {
        element.style.transition = "";
        resolve();
      }, _config.duration);
    });
  });
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.duration) _config.duration = ctx.duration;
  if (ctx && ctx.enabled !== void 0) _config.enabled = Boolean(ctx.enabled);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { enabled: { ok: _config.enabled, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: _config, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var transitions_default = { MODULE_ID, VERSION, TYPES, init, setConfig, getConfig, beforeLeave, afterEnter, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  TYPES,
  VERSION,
  afterEnter,
  beforeLeave,
  transitions_default as default,
  getConfig,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  setConfig
};
