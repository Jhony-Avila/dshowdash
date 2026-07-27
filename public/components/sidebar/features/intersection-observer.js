import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.0.0-NCS";
const MODULE_ID = "sidebar.features.intersection-observer";
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
let _eventBus = null;
let _observer = null;
let _observedItems = /* @__PURE__ */ new Set();
let _renderQueue = [];
let _isProcessing = false;
let _processTimer = null;
let _metrics = { observes: 0, renders: 0, unrenders: 0 };
const CONFIG = {
  rootMargin: "100px 0px",
  threshold: 0.1,
  batchSize: 10,
  batchDelay: 16
};
function init(ctxOrEventBus, containerArg, configArg = {}) {
  if (ctxOrEventBus && typeof ctxOrEventBus === "object" && !ctxOrEventBus.emit) {
    const ctx = ctxOrEventBus;
    const ports = ctx.ports;
    const eventBus = ctx.eventBus;
    const sidebarEl = ctx.sidebarEl;
    if (ports) Ports.inject(ports);
    _initPorts();
    _eventBus = eventBus || _getPort("eventBus");
    _container = sidebarEl;
    if (ctx.config) Object.assign(CONFIG, ctx.config);
  } else {
    _eventBus = ctxOrEventBus;
    _container = containerArg;
    if (configArg) Object.assign(CONFIG, configArg);
    _initPorts();
  }
  if (!("IntersectionObserver" in window)) {
    _getPort("logger")?.warn?.("[IntersectionObserver] Not supported, rendering all items");
    return { ok: true, supported: false };
  }
  if (!_container) {
    _getPort("logger")?.info?.("[IntersectionObserver] No container, will observe when available");
    return { ok: true, deferred: true };
  }
  createObserver();
  observeItems();
  _eventBus?.on?.("sidebar:items-updated", observeItems);
  _eventBus?.emit?.("sidebar:intersection-observer:initialized");
  return { ok: true, supported: true };
}
function createObserver() {
  if (!_container) return;
  _observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        queueRender(entry.target);
      } else {
        queueUnrender(entry.target);
      }
    });
  }, {
    root: _container?.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`),
    rootMargin: CONFIG.rootMargin,
    threshold: CONFIG.threshold
  });
}
function observeItems() {
  if (!_observer || !_container) return;
  _observedItems.forEach((item) => {
    if (!_container.contains(item)) {
      _observer.unobserve(item);
      _observedItems.delete(item);
    }
  });
  const items = _container.querySelectorAll(`.${C.ITEM}:not([data-observed])`);
  items.forEach((item) => {
    item.dataset.observed = "true";
    item.dataset.rendered = "false";
    if (!item.classList.contains(C.ITEM_PLACEHOLDER)) {
      createPlaceholder(item);
    }
    _observer.observe(item);
    _observedItems.add(item);
    _metrics.observes++;
  });
}
function createPlaceholder(item) {
  const height = item.offsetHeight || 40;
  item.dataset.originalContent = item.innerHTML;
  item.dataset.originalHeight = height;
  item.innerHTML = `<div class="dsd-sidebar__item-placeholder" style="height: ${height}px"><div class="dsd-sidebar__item-placeholder-icon"></div><div class="dsd-sidebar__item-placeholder-text"></div></div>`;
  item.classList.add(C.ITEM_PLACEHOLDER);
}
function restoreContent(item) {
  if (item.dataset.originalContent) {
    item.innerHTML = item.dataset.originalContent;
    item.classList.remove(C.ITEM_PLACEHOLDER);
    item.dataset.rendered = "true";
    delete item.dataset.originalContent;
  }
}
function queueRender(item) {
  if (item.dataset.rendered === "true") return;
  if (!_renderQueue.includes(item)) _renderQueue.push(item);
  processQueue();
}
function queueUnrender(item) {
  _metrics.unrenders++;
}
function processQueue() {
  if (_isProcessing || _renderQueue.length === 0) return;
  _isProcessing = true;
  requestAnimationFrame(() => {
    const batch = _renderQueue.splice(0, CONFIG.batchSize);
    batch.forEach((item) => {
      restoreContent(item);
      _metrics.renders++;
      item.style.opacity = "0";
      item.style.transform = "translateX(-10px)";
      requestAnimationFrame(() => {
        item.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        item.style.opacity = "1";
        item.style.transform = "translateX(0)";
      });
    });
    _isProcessing = false;
    if (_renderQueue.length > 0) {
      if (_processTimer) clearTimeout(_processTimer);
      _processTimer = setTimeout(() => {
        _processTimer = null;
        processQueue();
      }, CONFIG.batchDelay);
    }
    _eventBus?.emit?.("sidebar:lazy-render", {
      rendered: batch.length,
      pending: _renderQueue.length
    });
  });
}
function renderAll() {
  _observedItems.forEach((item) => {
    if (item.dataset.rendered !== "true") restoreContent(item);
  });
  _renderQueue = [];
}
function getStats() {
  let rendered = 0, placeholder = 0;
  _observedItems.forEach((item) => {
    if (item.dataset.rendered === "true") rendered++;
    else placeholder++;
  });
  return { total: _observedItems.size, rendered, placeholder, pending: _renderQueue.length };
}
function cleanup() {
  if (_processTimer) {
    clearTimeout(_processTimer);
    _processTimer = null;
  }
  _observer?.disconnect();
  _observer = null;
  _observedItems.clear();
  _renderQueue = [];
  _eventBus = null;
  _container = null;
}
function destroy() {
  cleanup();
}
function getMetrics() {
  return { ..._metrics, ...getStats() };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    stats: getStats(),
    metrics: getMetrics(),
    portsInitialized: Ports.isInitialized()
  };
}
function healthCheck() {
  const supported = "IntersectionObserver" in window;
  return {
    status: supported ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      supported,
      hasContainer: !!_container,
      hasObserver: !!_observer,
      noOrphanTimers: !_processTimer,
      portsInitialized: Ports.isInitialized()
    },
    metrics: getMetrics()
  };
}
var intersection_observer_default = {
  init,
  cleanup,
  observeItems,
  renderAll,
  getStats,
  destroy,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  intersection_observer_default as default,
  destroy,
  getMetrics,
  getPorts,
  getStats,
  healthCheck,
  info,
  init,
  injectPorts,
  observeItems,
  renderAll
};
