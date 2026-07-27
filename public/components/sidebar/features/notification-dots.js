import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "7.1.0-ES6";
const MODULE_ID = "sidebar-notification-dots";
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
let _container = null;
let _dots = /* @__PURE__ */ new Map();
let _cleanups = [];
let _metrics = { shows: 0, hides: 0, updates: 0 };
const DOT_VARIANTS = {
  default: { color: "#ef4444", size: 8 },
  success: { color: "#10b981", size: 8 },
  warning: { color: "#f59e0b", size: 8 },
  info: { color: "#3b82f6", size: 8 },
  urgent: { color: "#ef4444", size: 10, pulse: true }
};
function handleNotification(data) {
  if (data?.itemId) showDot(data.itemId, data.variant || "default", data.count);
}
function handleClear(data) {
  if (data?.itemId) hideDot(data.itemId);
}
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const unsub1 = eb.on(SIDEBAR_EVENTS.NOTIFICATION, handleNotification);
    const unsub2 = eb.on(SIDEBAR_EVENTS.NOTIFICATION_CLEAR, handleClear);
    _cleanups.push(
      typeof unsub1 === "function" ? unsub1 : () => {
        if (eb.off) eb.off(SIDEBAR_EVENTS.NOTIFICATION, handleNotification);
      }
    );
    _cleanups.push(
      typeof unsub2 === "function" ? unsub2 : () => {
        if (eb.off) eb.off(SIDEBAR_EVENTS.NOTIFICATION_CLEAR, handleClear);
      }
    );
  }
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.DOTS_INITIALIZED);
}
function showDot(itemId, variant = "default", count = null) {
  const item = _container?.querySelector(`[data-item-id="${itemId}"]`);
  if (!item) return false;
  hideDot(itemId);
  const config = DOT_VARIANTS[variant] || DOT_VARIANTS.default;
  const dot = createDotElement(config, count);
  const link = item.querySelector(`.${C.LINK}`);
  if (link) {
    link.style.position = "relative";
    link.appendChild(dot);
  } else {
    item.style.position = "relative";
    item.appendChild(dot);
  }
  _dots.set(itemId, { element: dot, variant, count });
  _metrics.shows++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.DOT_SHOWN, { itemId, variant, count });
  return true;
}
function createDotElement(config, count) {
  const dot = document.createElement("span");
  dot.className = "dsd-notification-dot";
  if (config.pulse) dot.classList.add("dsd-notification-dot--pulse");
  dot.style.cssText = `position:absolute;top:8px;right:8px;width:${config.size}px;height:${config.size}px;background:${config.color};border-radius:50%;border:2px solid var(--surface-base,#1a1a2e);z-index:10;pointer-events:none;`;
  if (count !== null && count > 0) {
    dot.classList.add("dsd-notification-dot--count");
    dot.textContent = count > 99 ? "99+" : count;
    dot.style.width = "auto";
    dot.style.minWidth = "16px";
    dot.style.height = "16px";
    dot.style.padding = "0 4px";
    dot.style.fontSize = "10px";
    dot.style.fontWeight = "600";
    dot.style.color = "white";
    dot.style.display = "flex";
    dot.style.alignItems = "center";
    dot.style.justifyContent = "center";
  }
  dot.style.animation = "dotAppear 0.3s ease-out";
  return dot;
}
function hideDot(itemId) {
  const dotData = _dots.get(itemId);
  if (!dotData) return false;
  const dot = dotData.element;
  dot.style.animation = "dotDisappear 0.2s ease-out forwards";
  _metrics.hides++;
  setTimeout(() => {
    dot.remove();
    _dots.delete(itemId);
  }, 200);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.DOT_HIDDEN, { itemId });
  return true;
}
function updateCount(itemId, count) {
  _metrics.updates++;
  const dotData = _dots.get(itemId);
  if (!dotData) return false;
  if (count <= 0) return hideDot(itemId);
  const dot = dotData.element;
  if (dot.classList.contains("dsd-notification-dot--count")) {
    dot.textContent = count > 99 ? "99+" : count;
    dot.style.animation = "dotPulse 0.3s ease-out";
  }
  dotData.count = count;
  return true;
}
function incrementCount(itemId, amount = 1) {
  const dotData = _dots.get(itemId);
  if (!dotData) {
    showDot(itemId, "default", amount);
    return amount;
  }
  const newCount = (dotData.count || 0) + amount;
  updateCount(itemId, newCount);
  return newCount;
}
function decrementCount(itemId, amount = 1) {
  const dotData = _dots.get(itemId);
  if (!dotData) return 0;
  const newCount = Math.max(0, (dotData.count || 0) - amount);
  if (newCount === 0) hideDot(itemId);
  else updateCount(itemId, newCount);
  return newCount;
}
function clearAll() {
  _dots.forEach((_, itemId) => {
    hideDot(itemId);
  });
}
function getAll() {
  const result = {};
  _dots.forEach((data, itemId) => {
    result[itemId] = { variant: data.variant, count: data.count };
  });
  return result;
}
function hasDot(itemId) {
  return _dots.has(itemId);
}
function destroy() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  clearAll();
  _container = null;
}
function getMetrics() {
  return { ..._metrics, activeDots: _dots.size, cleanups: _cleanups.length };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    activeDots: _dots.size,
    dots: getAll(),
    cleanups: _cleanups.length,
    metrics: getMetrics(),
    p24Compliant: true
  };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    checks: { activeDots: _dots.size, noOrphanListeners: true },
    metrics: getMetrics(),
    p24Compliant: true
  };
}
var notification_dots_default = { init, showDot, hideDot, updateCount, incrementCount, decrementCount, clearAll, getAll, hasDot, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearAll,
  decrementCount,
  notification_dots_default as default,
  destroy,
  getAll,
  getMetrics,
  getPorts,
  hasDot,
  healthCheck,
  hideDot,
  incrementCount,
  info,
  init,
  injectPorts,
  showDot,
  updateCount
};
