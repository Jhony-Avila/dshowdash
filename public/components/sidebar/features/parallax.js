import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-parallax";
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
let _enabled = false;
let _cleanup = null;
let _metrics = { enables: 0, disables: 0, scrollEvents: 0 };
function init(eventBus) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.PARALLAX_INITIALIZED);
}
function enable(container) {
  if (!container || _enabled) return false;
  container.classList.add(C.MOD_PARALLAX);
  const navContent = container.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`);
  if (!navContent) return false;
  const handler = () => {
    _metrics.scrollEvents++;
    const scrollTop = navContent.scrollTop;
    const offset = scrollTop * -0.3;
    container.style.setProperty("--parallax-offset", `${offset}px`);
  };
  navContent.addEventListener("scroll", handler, { passive: true });
  _cleanup = () => {
    navContent.removeEventListener("scroll", handler);
    container.classList.remove(C.MOD_PARALLAX);
    container.style.removeProperty("--parallax-offset");
  };
  _enabled = true;
  _metrics.enables++;
  return true;
}
function disable() {
  if (_cleanup) {
    _cleanup();
    _cleanup = null;
  }
  _enabled = false;
  _metrics.disables++;
}
function toggle(container) {
  if (_enabled) {
    disable();
    return false;
  } else {
    return enable(container);
  }
}
function isEnabled() {
  return _enabled;
}
function destroy() {
  disable();
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _enabled, metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { enabled: _enabled }, metrics: getMetrics() };
}
var parallax_default = { init, enable, disable, toggle, isEnabled, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  parallax_default as default,
  destroy,
  disable,
  enable,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled,
  toggle
};
