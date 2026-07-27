import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.icons.arrow";
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
const DIRECTIONS = { UP: "up", DOWN: "down", LEFT: "left", RIGHT: "right" };
const _config = { size: 16, color: "currentColor", strokeWidth: 2 };
function render(direction, options) {
  options = Object.assign({}, _config, options || {});
  const paths = { up: "M18 15l-6-6-6 6", down: "M6 9l6 6 6-6", left: "M15 18l-6-6 6-6", right: "M9 18l6-6-6-6" };
  const d = paths[direction] || paths.right;
  return `<svg width="${options.size}" height="${options.size}" viewBox="0 0 24 24" fill="none" stroke="${options.color}" stroke-width="${options.strokeWidth}"><polyline points="${d}"></polyline></svg>`;
}
function setConfig(config) {
  Object.assign(_config, config);
  return { ok: true };
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: "info" } } };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: _config, portsInitialized: Ports.isInitialized() };
}
var icon_arrow_default = { MODULE_ID, VERSION, DIRECTIONS, init, render, setConfig, healthCheck, info, injectPorts, getPorts };
export {
  DIRECTIONS,
  MODULE_ID,
  VERSION,
  icon_arrow_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  render,
  setConfig
};
