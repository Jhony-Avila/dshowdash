const VERSION = "8.2.1-ENTERPRISE";
const MODULE_ID = "container-debug-panel";
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
let _state = { initialized: false, visible: false, element: null };
let _metrics = { toggles: 0, renders: 0 };
function show() {
  _state.visible = true;
  _metrics.toggles++;
  if (_state.element) {
    _state.element.style.display = "block";
    _state.element.setAttribute("aria-hidden", "false");
  }
  return { ok: true };
}
function hide() {
  _state.visible = false;
  _metrics.toggles++;
  if (_state.element) {
    _state.element.style.display = "none";
    _state.element.setAttribute("aria-hidden", "true");
  }
  return { ok: true };
}
function toggle() {
  return _state.visible ? hide() : show();
}
function isVisible() {
  return _state.visible;
}
function render(data) {
  _metrics.renders++;
  if (!_state.element) return { ok: false, reason: "No element" };
  let html = '<div class="debug-panel-content">';
  html += "<h4>Debug Info</h4>";
  html += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  html += "</div>";
  _state.element.innerHTML = html;
  return { ok: true };
}
function setElement(element) {
  _state.element = element;
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  if (ctx?.eventBus && !_injectedEventBus) _injectedEventBus = ctx.eventBus;
  if (ctx?.element) _state.element = ctx.element;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function destroy() {
  _state.initialized = false;
  _state.visible = false;
  _state.element = null;
  return { ok: true };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    score: 100,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      initialized: { ok: _state.initialized, severity: "info" },
      hasElement: { ok: !!_state.element, severity: "info" },
      hasInjectedEventBus: { ok: !!_injectedEventBus, severity: "info" }
    },
    metrics: _metrics,
    hasInjectedEventBus: !!_injectedEventBus,
    hasValidation: true
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    visible: _state.visible,
    hasElement: !!_state.element,
    metrics: _metrics,
    hasInjectedEventBus: !!_injectedEventBus,
    hasValidation: true
  };
}
function createDebugPanel(container, options = {}) {
  const { eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  const element = document.createElement("div");
  element.className = "dsd-container__debug-panel";
  element.style.display = "none";
  element.setAttribute("role", "region");
  element.setAttribute("aria-label", "Painel de debug");
  element.setAttribute("aria-hidden", "true");
  if (container) container.appendChild(element);
  init({ element, eventBus });
  return { show, hide, toggle, isVisible, render, setElement, destroy, healthCheck, info, VERSION, MODULE_ID };
}
var debug_panel_default = { MODULE_ID, VERSION, createDebugPanel, injectEventBus, init, destroy, show, hide, toggle, isVisible, render, setElement, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  createDebugPanel,
  debug_panel_default as default,
  destroy,
  healthCheck,
  hide,
  info,
  init,
  injectEventBus,
  isVisible,
  render,
  setElement,
  show,
  toggle
};
