import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.9.0-ES6";
const MODULE_ID = "sidebar-compact-mode";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const STORAGE_KEY = "dsd-sidebar-compact";
const CLASS_NAME = "dsd-sidebar--compact";
let _enabled = false;
let _container = null;
let _metrics = { enables: 0, disables: 0, toggles: 0 };
function loadState() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch (e) {
    return false;
  }
}
function saveState(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch (e) {
  }
}
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const saved = loadState();
  if (saved && container) enable(container);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMPACT_INITIALIZED);
  return saved;
}
function enable(container) {
  _container = container || _container;
  if (!_container) return false;
  _container.classList.add(CLASS_NAME);
  _container.setAttribute("data-compact", "true");
  _enabled = true;
  _metrics.enables++;
  saveState(true);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMPACT_ENABLED);
  return true;
}
function disable(container) {
  _container = container || _container;
  if (!_container) return false;
  _container.classList.remove(CLASS_NAME);
  _container.removeAttribute("data-compact");
  _enabled = false;
  _metrics.disables++;
  saveState(false);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMPACT_DISABLED);
  return true;
}
function toggle(container) {
  _container = container || _container;
  _metrics.toggles++;
  if (_enabled) {
    disable(_container);
    return false;
  } else {
    enable(_container);
    return true;
  }
}
function isEnabled() {
  return _enabled;
}
function getContainer() {
  return _container;
}
function destroy() {
  if (_container) {
    _container.classList.remove(CLASS_NAME);
    _container.removeAttribute("data-compact");
  }
  _container = null;
  _enabled = false;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _enabled, hasContainer: !!_container, metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { enabled: _enabled, hasContainer: !!_container }, metrics: getMetrics() };
}
var compact_mode_default = { init, enable, disable, toggle, isEnabled, getContainer, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  compact_mode_default as default,
  destroy,
  disable,
  enable,
  getContainer,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled,
  toggle
};
