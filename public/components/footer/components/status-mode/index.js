import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.status-mode";
const VERSION = "2.3.0-P18EC";
const MODE_EVENTS = { CHANGED: "footer:mode:changed" };
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
const MODES = { NORMAL: "normal", COMPACT: "compact", EXPANDED: "expanded", MINIMAL: "minimal" };
const _state = { initialized: false, mode: MODES.NORMAL };
const _metrics = { changes: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function setMode(mode) {
  if (!MODES[mode.toUpperCase()]) return { ok: false, reason: "Invalid mode" };
  const prev = _state.mode;
  _state.mode = mode;
  _metrics.changes++;
  _emit(MODE_EVENTS.CHANGED, { from: prev, to: mode });
  return { ok: true, mode };
}
function getMode() {
  return _state.mode;
}
function toggleMode() {
  const modes = Object.values(MODES);
  const idx = modes.indexOf(_state.mode);
  const next = modes[(idx + 1) % modes.length];
  return setMode(next);
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.mode) _state.mode = ctx.mode;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, mode: _state.mode, availableModes: Object.values(MODES), metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function SystemModeIndicatorComponent(options) {
  options = options || {};
  this._container = options.container || null;
  this._mounted = false;
  this._element = null;
}
SystemModeIndicatorComponent.prototype.mount = function() {
  const self = this;
  if (this._mounted) return Promise.resolve();
  if (!this._container) return Promise.resolve();
  init();
  this._element = document.createElement("div");
  this._element.className = "dsd-footer__mode-indicator dsd-chip dsd-chip--sm";
  this._element.title = "System Mode";
  this._element.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span class="dsd-footer__mode-text">${_state.mode}</span>`;
  this._element.addEventListener("click", () => {
    toggleMode();
    const textEl = self._element.querySelector(".dsd-footer__mode-text");
    if (textEl) textEl.textContent = _state.mode;
  });
  this._container.appendChild(this._element);
  this._mounted = true;
  return Promise.resolve();
};
SystemModeIndicatorComponent.prototype.destroy = function() {
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  this._mounted = false;
};
SystemModeIndicatorComponent.prototype.isLoaded = function() {
  return this._mounted;
};
SystemModeIndicatorComponent.prototype.getMode = () => getMode();
SystemModeIndicatorComponent.prototype.setMode = (mode) => setMode(mode);
SystemModeIndicatorComponent.prototype.toggleMode = () => toggleMode();
SystemModeIndicatorComponent.prototype.healthCheck = () => healthCheck();
SystemModeIndicatorComponent.prototype.info = () => info();
var status_mode_default = SystemModeIndicatorComponent;
export {
  MODES,
  MODE_EVENTS,
  MODULE_ID,
  SystemModeIndicatorComponent,
  VERSION,
  status_mode_default as default,
  getMode,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  setMode,
  toggleMode
};
