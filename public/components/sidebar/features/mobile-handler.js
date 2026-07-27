import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-mobile-handler";
let _container = null;
let _isMobile = false;
let _isOpen = false;
let _cleanups = [];
let _metrics = { toggles: 0, detects: 0, overlayClicks: 0, swipes: 0, errors: 0 };
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;
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
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MOBILE_HANDLER_INITIALIZED);
}
function setupMobileHandler(dependencies) {
  const { container, eventBus, breakpoint = 768 } = dependencies || {};
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  if (container && !_container) _container = container;
  const checkMobile = () => {
    const wasMobile = _isMobile;
    _isMobile = window.innerWidth < breakpoint;
    _metrics.detects++;
    if (wasMobile !== _isMobile) {
      const eb = _getPort("eventBus");
      if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MOBILE_CHANGED, { isMobile: _isMobile });
      if (_isMobile) {
        if (container) container.classList.add(C.MOD_MOBILE);
        document.body.classList.add("has-mobile-sidebar");
      } else {
        if (container) container.classList.remove(C.MOD_MOBILE, C.MOD_MOBILE_OPEN);
        document.body.classList.remove("has-mobile-sidebar", "sidebar-mobile-open");
        _isOpen = false;
      }
    }
  };
  checkMobile();
  window.addEventListener("resize", checkMobile);
  _cleanups.push(() => window.removeEventListener("resize", checkMobile));
  return () => destroy();
}
function setupMobileDetect(dependencies) {
  return setupMobileHandler(dependencies);
}
function setupSwipeGestures(dependencies) {
  const { container, eventBus, onOpen, onClose } = dependencies || {};
  if (!container) return () => {
  };
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isSwiping = false;
  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = false;
  };
  const handleTouchMove = (e) => {
    if (!touchStartX) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) isSwiping = true;
  };
  const handleTouchEnd = (e) => {
    if (!isSwiping) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    const deltaTime = Date.now() - touchStartTime;
    const velocity = Math.abs(deltaX) / deltaTime;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
      _metrics.swipes++;
      if (deltaX > 0 && !_isOpen) openMobile(container, onOpen);
      else if (deltaX < 0 && _isOpen) closeMobile(container, onClose);
    }
    touchStartX = 0;
    touchStartY = 0;
    isSwiping = false;
  };
  const edgeWidth = 20;
  const edgeHandler = (e) => {
    if (e.touches[0].clientX < edgeWidth && !_isOpen) handleTouchStart(e);
  };
  document.addEventListener("touchstart", edgeHandler, { passive: true });
  container.addEventListener("touchstart", handleTouchStart, { passive: true });
  container.addEventListener("touchmove", handleTouchMove, { passive: true });
  container.addEventListener("touchend", handleTouchEnd, { passive: true });
  _cleanups.push(() => document.removeEventListener("touchstart", edgeHandler));
  _cleanups.push(() => container.removeEventListener("touchstart", handleTouchStart));
  _cleanups.push(() => container.removeEventListener("touchmove", handleTouchMove));
  _cleanups.push(() => container.removeEventListener("touchend", handleTouchEnd));
  return () => destroy();
}
function setupOverlayClick(dependencies) {
  const { container, eventBus, onClose } = dependencies || {};
  let overlay = document.querySelector(".dsd-sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "dsd-sidebar-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }
  const handler = () => {
    _metrics.overlayClicks++;
    closeMobile(container, onClose);
  };
  overlay.addEventListener("click", handler);
  _cleanups.push(() => overlay.removeEventListener("click", handler));
  return {
    show: () => {
      overlay.classList.add("dsd-sidebar-overlay--visible");
      document.body.classList.add("sidebar-mobile-open");
    },
    hide: () => {
      overlay.classList.remove("dsd-sidebar-overlay--visible");
      document.body.classList.remove("sidebar-mobile-open");
    },
    destroy: () => overlay.remove()
  };
}
function openMobile(container, onOpen) {
  _isOpen = true;
  _metrics.toggles++;
  if (container) container.classList.add(C.MOD_MOBILE_OPEN);
  document.body.classList.add("sidebar-mobile-open");
  const overlay = document.querySelector(".dsd-sidebar-overlay");
  if (overlay) overlay.classList.add("dsd-sidebar-overlay--visible");
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MOBILE_OPENED, { source: "swipe" });
  if (onOpen) onOpen();
}
function closeMobile(container, onClose) {
  _isOpen = false;
  _metrics.toggles++;
  if (container) container.classList.remove(C.MOD_MOBILE_OPEN);
  document.body.classList.remove("sidebar-mobile-open");
  const overlay = document.querySelector(".dsd-sidebar-overlay");
  if (overlay) overlay.classList.remove("dsd-sidebar-overlay--visible");
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MOBILE_CLOSED, { source: "swipe" });
  if (onClose) onClose();
}
function toggleMobile(open) {
  _isOpen = open ?? !_isOpen;
  _metrics.toggles++;
  return _isOpen;
}
function isMobile() {
  return _isMobile;
}
function isOpen() {
  return _isOpen;
}
function getMetrics() {
  return { ..._metrics };
}
function destroy() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch {
    }
  });
  _cleanups = [];
  _isMobile = false;
  _isOpen = false;
  _container = null;
  const overlay = document.querySelector(".dsd-sidebar-overlay");
  if (overlay) overlay.remove();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, isMobile: _isMobile, isOpen: _isOpen, cleanups: _cleanups.length, metrics: getMetrics(), portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { isMobile: _isMobile, isOpen: _isOpen, noErrors: _metrics.errors === 0, noOrphanListeners: true, portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
var mobile_handler_default = { init, setupMobileHandler, setupMobileDetect, setupSwipeGestures, setupOverlayClick, toggleMobile, isMobile, isOpen, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  mobile_handler_default as default,
  destroy,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isMobile,
  isOpen,
  setupMobileDetect,
  setupMobileHandler,
  setupOverlayClick,
  setupSwipeGestures,
  toggleMobile
};
