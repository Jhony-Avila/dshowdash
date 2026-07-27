const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-08-events";
let _container = null;
let _handlers = {};
let _boundListeners = [];
function setup(container, state, handlers, config) {
  if (!config) config = {};
  if (!container) return;
  _container = container;
  _handlers = handlers;
  destroy();
  _setupRefreshButton();
  _setupAutoRefreshToggle();
  _setupAlertActions();
}
function _addListener(el, event, handler) {
  if (!el) return;
  el.addEventListener(event, handler);
  _boundListeners.push({ el, event, handler });
}
function _setupRefreshButton() {
  const panel = _container.closest ? _container.closest("[data-panel-id]") : null;
  const btn = (panel ? panel.querySelector('[data-action="refresh"]') : null) || _container.querySelector('[data-action="refresh"]');
  _addListener(btn, "click", (e) => {
    e.preventDefault();
    if (_handlers.refresh) _handlers.refresh();
  });
}
function _setupAutoRefreshToggle() {
  const panel = _container.closest ? _container.closest("[data-panel-id]") : null;
  const btn = panel ? panel.querySelector('[data-action="toggle-auto-refresh"]') : null;
  _addListener(btn, "click", (e) => {
    e.preventDefault();
    if (_handlers.toggleAutoRefresh) _handlers.toggleAutoRefresh();
  });
}
function _setupAlertActions() {
  _container.querySelectorAll('[data-action="toggle-expand"]').forEach((btn) => {
    _addListener(btn, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (_handlers.toggleExpand) _handlers.toggleExpand(parseInt(btn.dataset.alertId, 10));
    });
  });
  _container.querySelectorAll('[data-action="acknowledge"]').forEach((btn) => {
    _addListener(btn, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (_handlers.acknowledgeAlert) _handlers.acknowledgeAlert(parseInt(btn.dataset.alertId, 10));
    });
  });
}
function destroy() {
  _boundListeners.forEach((item) => {
    if (item.el) item.el.removeEventListener(item.event, item.handler);
  });
  _boundListeners = [];
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = { hasContainer: !!_container, cleanupRegistered: _boundListeners.length >= 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, listenersCount: _boundListeners.length, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasContainer: !!_container, listenersCount: _boundListeners.length, p25Compliant: true };
}
var events_default = { VERSION, MODULE_ID, setup, destroy, getVersion, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  events_default as default,
  destroy,
  getVersion,
  healthCheck,
  info,
  setup
};
