import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-mini-mode";
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
const STORAGE_KEY = "dsd-sidebar-mini";
let _enabled = false;
let _container = null;
let _cleanups = [];
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
function setupHoverExpand(container) {
  const handleEnter = () => {
    if (_enabled) container.classList.add(C.MOD_MINI_HOVER);
  };
  const handleLeave = () => {
    container.classList.remove(C.MOD_MINI_HOVER);
  };
  container.addEventListener("mouseenter", handleEnter);
  container.addEventListener("mouseleave", handleLeave);
  _cleanups.push(() => {
    container.removeEventListener("mouseenter", handleEnter);
  });
  _cleanups.push(() => {
    container.removeEventListener("mouseleave", handleLeave);
  });
}
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  if (container) setupHoverExpand(container);
  const saved = loadState();
  if (saved && container) enable(container);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MINI_INITIALIZED);
  return saved;
}
function enable(container) {
  _container = container || _container;
  if (!_container) return false;
  _container.classList.add(C.MOD_MINI);
  _container.setAttribute("data-mini", "true");
  _enabled = true;
  _metrics.enables++;
  saveState(true);
  _container.querySelectorAll(`.${C.ITEM}`).forEach((item) => {
    const label = item.querySelector(`.${C.ITEM_LABEL}`);
    if (label) item.setAttribute("title", label.textContent || "");
  });
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MINI_ENABLED);
  return true;
}
function disable(container) {
  _container = container || _container;
  if (!_container) return false;
  _container.classList.remove(C.MOD_MINI);
  _container.classList.remove(C.MOD_MINI_HOVER);
  _container.removeAttribute("data-mini");
  _enabled = false;
  _metrics.disables++;
  saveState(false);
  _container.querySelectorAll(`.${C.ITEM}[title]`).forEach((item) => {
    item.removeAttribute("title");
  });
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MINI_DISABLED);
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
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  disable(_container);
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _enabled, hasContainer: !!_container, cleanups: _cleanups.length, metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { enabled: _enabled, hasContainer: !!_container }, metrics: getMetrics() };
}
var mini_mode_default = { init, enable, disable, toggle, isEnabled, getContainer, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  mini_mode_default as default,
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
