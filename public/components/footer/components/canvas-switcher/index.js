import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.canvas-switcher";
const VERSION = "2.3.0-P18EC";
const CANVAS_EVENTS = { SWITCHED: "footer:canvas:switched" };
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
const _state = { initialized: false, activeCanvas: "main", canvases: ["main"], mounted: false, container: null, element: null, abortController: null };
const _metrics = { switches: 0 };
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
function registerCanvas(id) {
  if (_state.canvases.indexOf(id) < 0) _state.canvases.push(id);
  return { ok: true };
}
function unregisterCanvas(id) {
  const idx = _state.canvases.indexOf(id);
  if (idx >= 0) {
    _state.canvases.splice(idx, 1);
    if (_state.activeCanvas === id) _state.activeCanvas = _state.canvases[0] || null;
    return { ok: true };
  }
  return { ok: false };
}
function switchCanvas(id) {
  if (_state.canvases.indexOf(id) < 0) return { ok: false, reason: "Canvas not registered" };
  const prev = _state.activeCanvas;
  _state.activeCanvas = id;
  _metrics.switches++;
  _emit(CANVAS_EVENTS.SWITCHED, { from: prev, to: id });
  _track("footer:canvas:switch", { from: prev, to: id });
  return { ok: true, canvas: id };
}
function getActiveCanvas() {
  return _state.activeCanvas;
}
function getCanvases() {
  return _state.canvases.slice();
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.canvases) _state.canvases = ctx.canvases;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function mount(container, options) {
  if (_state.mounted) return { ok: true, alreadyMounted: true };
  if (!container) return { ok: false, reason: "No container provided" };
  init(options);
  _state.container = container;
  _state.element = document.createElement("div");
  _state.element.className = "dsd-footer__canvas-switcher-inner";
  _state.element.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span class="dsd-footer__canvas-label">${_state.activeCanvas}</span>`;
  _state.abortController = new AbortController();
  _state.element.addEventListener("click", () => {
    const canvases = getCanvases();
    if (canvases.length < 2) return;
    const currentIdx = canvases.indexOf(_state.activeCanvas);
    const nextIdx = (currentIdx + 1) % canvases.length;
    switchCanvas(canvases[nextIdx]);
    const labelEl = _state.element.querySelector(".dsd-footer__canvas-label");
    if (labelEl) labelEl.textContent = _state.activeCanvas;
  }, { signal: _state.abortController.signal });
  container.appendChild(_state.element);
  _state.mounted = true;
  return { ok: true, version: VERSION };
}
function unmount() {
  if (!_state.mounted) return { ok: true };
  if (_state.abortController) {
    _state.abortController.abort();
    _state.abortController = null;
  }
  if (_state.element && _state.element.parentNode) {
    _state.element.parentNode.removeChild(_state.element);
  }
  _state.element = null;
  _state.container = null;
  _state.mounted = false;
  return { ok: true };
}
function destroy() {
  unmount();
  _state.canvases = ["main"];
  _state.activeCanvas = "main";
  _state.initialized = false;
  _metrics.switches = 0;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, mounted: { ok: _state.mounted, severity: "info" }, hasActiveCanvas: { ok: !!_state.activeCanvas, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, mounted: _state.mounted, activeCanvas: _state.activeCanvas, canvasesCount: _state.canvases.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var canvas_switcher_default = { MODULE_ID, VERSION, CANVAS_EVENTS, init, mount, unmount, destroy, registerCanvas, unregisterCanvas, switchCanvas, getActiveCanvas, getCanvases, healthCheck, info, injectPorts, getPorts };
export {
  CANVAS_EVENTS,
  MODULE_ID,
  VERSION,
  canvas_switcher_default as default,
  destroy,
  getActiveCanvas,
  getCanvases,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  mount,
  registerCanvas,
  switchCanvas,
  unmount,
  unregisterCanvas
};
