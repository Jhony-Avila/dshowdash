import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { SELECTORS, CSS_CLASSES, DATA_ATTRS } from "../core/constants.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/shell/header-shell";
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const _elements = { container: null, header: null, left: null, center: null, right: null, statusTray: null };
const _state = { mounted: false, visible: true, scrolled: false, resizeObserver: null };
let _abortController = null;
let _coreUnsubscribe = null;
let _Core = null;
let _PluginSystem = null;
function init(containerSelector, dependencies) {
  _initPorts();
  dependencies = dependencies || {};
  _Core = dependencies.Core || null;
  _PluginSystem = dependencies.PluginSystem || null;
  containerSelector = containerSelector || SELECTORS.CONTAINER;
  _elements.container = document.querySelector(containerSelector);
  if (!_elements.container) {
    _log("error", "Container nao encontrado:", containerSelector);
    return false;
  }
  if (_Core && _Core.setShell) {
    _Core.setShell({ render, showFallback, hideFallback, updateComponent });
  }
  if (_Core && _Core.onStateChange) {
    _coreUnsubscribe = _Core.onStateChange(_handleCoreStateChange);
  }
  _log("info", "HeaderShell inicializado");
  return true;
}
function mount() {
  if (_state.mounted) {
    _log("warn", "Shell ja montado");
    return Promise.resolve();
  }
  _abortController = new AbortController();
  const signal = _abortController.signal;
  const hookPromise = _PluginSystem ? _PluginSystem.executeHook("beforeMount", { shell: this }) : Promise.resolve();
  return hookPromise.then(function() {
    _elements.header = _elements.container.querySelector(SELECTORS.HEADER) || _createHeaderStructure();
    _elements.left = _elements.container.querySelector(SELECTORS.HEADER_LEFT);
    _elements.center = _elements.container.querySelector(SELECTORS.HEADER_CENTER);
    _elements.right = _elements.container.querySelector(SELECTORS.HEADER_RIGHT);
    _elements.statusTray = _elements.container.querySelector(SELECTORS.STATUS_TRAY);
    _setupEventListeners(signal);
    _setupObservers();
    _state.mounted = true;
    _log("info", "Shell montado");
    if (_PluginSystem) {
      return _PluginSystem.executeHook("afterMount", { shell: this, elements: _elements });
    }
  });
}
function unmount() {
  if (!_state.mounted) return;
  if (_PluginSystem) {
    _PluginSystem.executeHook("beforeUnmount", { shell: this });
  }
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  if (_state.resizeObserver) {
    _state.resizeObserver.disconnect();
    _state.resizeObserver = null;
  }
  if (_coreUnsubscribe) {
    _coreUnsubscribe();
    _coreUnsubscribe = null;
  }
  _state.mounted = false;
  _log("info", "Shell desmontado");
  if (_PluginSystem) {
    _PluginSystem.executeHook("afterUnmount", { shell: this });
  }
}
function _createHeaderStructure() {
  const header = document.createElement("header");
  header.className = "header";
  header.setAttribute("role", "banner");
  header.innerHTML = '<div class="header-left"></div><div class="header-center"></div><div class="header-right"></div>';
  _elements.container.appendChild(header);
  return header;
}
function _setupEventListeners(signal) {
  window.addEventListener("scroll", _handleScroll, { passive: true, signal });
  window.addEventListener("resize", _debounce(_handleResize, 150), { signal });
  _elements.container.addEventListener("click", _handleClick, { signal });
  _elements.container.addEventListener("keydown", _handleKeydown, { signal });
  _elements.container.addEventListener("focusin", _handleFocusIn, { signal });
  _elements.container.addEventListener("focusout", _handleFocusOut, { signal });
}
function _setupObservers() {
  if (window.ResizeObserver) {
    _state.resizeObserver = new ResizeObserver(_debounce((entries) => {
      _handleContainerResize(entries[0]);
    }, 100));
    _state.resizeObserver.observe(_elements.container);
  }
}
function _handleCoreStateChange(event) {
  _log("debug", "Core state change:", event.type);
  switch (event.type) {
    case "health:updated":
      _updateHealthIndicators();
      break;
    case "alerts:updated":
      _updateAlertsIndicators();
      break;
    case "network:changed":
      _updateNetworkIndicator(event.state.networkStatus);
      break;
  }
}
function _handleScroll() {
  const scrolled = window.scrollY > 50;
  if (scrolled !== _state.scrolled) {
    _state.scrolled = scrolled;
    if (_elements.header) {
      _elements.header.classList.toggle("header-scrolled", scrolled);
    }
  }
}
function _handleResize() {
  if (_PluginSystem) {
    _PluginSystem.executeHook("onResize", { width: window.innerWidth, height: window.innerHeight });
  }
}
function _handleContainerResize(entry) {
  _log("debug", "Container resized:", entry.contentRect.width);
}
function _handleClick(event) {
  const target = event.target.closest(`[${DATA_ATTRS.PANEL_TRIGGER}]`);
  if (target) {
    const panelId = target.getAttribute(DATA_ATTRS.PANEL_TRIGGER);
    _emitEvent("panel:trigger", { panelId, target });
    return;
  }
  const uarpsTrigger = event.target.closest(`[${DATA_ATTRS.UARPS_TRIGGER}]`);
  if (uarpsTrigger) {
    const uarpsId = uarpsTrigger.getAttribute(DATA_ATTRS.UARPS_TRIGGER);
    _emitEvent("uarps:trigger", { uarpsId, target: uarpsTrigger });
    return;
  }
}
function _handleKeydown(event) {
  if (event.key === "Escape") {
    _emitEvent("escape:pressed");
  }
}
function _handleFocusIn(event) {
  const component = event.target.closest(`[${DATA_ATTRS.COMPONENT_KEY}]`);
  if (component) {
    component.classList.add("header-component-focused");
  }
}
function _handleFocusOut(event) {
  const component = event.target.closest(`[${DATA_ATTRS.COMPONENT_KEY}]`);
  if (component) {
    component.classList.remove("header-component-focused");
  }
}
function render() {
  if (!_state.mounted) {
    _log("warn", "Shell nao montado");
    return;
  }
  if (_PluginSystem) {
    _PluginSystem.executeHook("beforeRender", { elements: _elements });
  }
  if (_PluginSystem) {
    _PluginSystem.executeHook("afterRender", { elements: _elements });
  }
}
function updateComponent(name, html) {
  const wrapper = _elements.container.querySelector(`[${DATA_ATTRS.COMPONENT_KEY}="${name}"]`);
  if (wrapper && html) {
    wrapper.innerHTML = html;
  }
}
function _updateHealthIndicators() {
}
function _updateAlertsIndicators() {
}
function _updateNetworkIndicator(status) {
  if (_elements.header) {
    _elements.header.setAttribute("data-network-status", status);
  }
}
function showFallback(type, message, options) {
  options = options || {};
  const existingFallback = _elements.container.querySelector(SELECTORS.FALLBACK);
  if (existingFallback) {
    existingFallback.remove();
  }
  const fallback = document.createElement("div");
  fallback.className = `header-fallback header-fallback-${type}`;
  fallback.setAttribute("role", "alert");
  fallback.setAttribute(DATA_ATTRS.FALLBACK_TYPE, type);
  fallback.innerHTML = `<span class="header-fallback-message">${_escapeHtml(message)}</span><button class="header-fallback-close" aria-label="Fechar">x</button>`;
  _elements.container.appendChild(fallback);
  requestAnimationFrame(() => {
    fallback.classList.add(CSS_CLASSES.FALLBACK_VISIBLE);
  });
  const closeBtn = fallback.querySelector(".header-fallback-close");
  if (closeBtn && _abortController) {
    closeBtn.addEventListener("click", () => {
      hideFallback();
    }, { signal: _abortController.signal });
  }
  if (options.autoHide !== false) {
    setTimeout(() => {
      hideFallback();
    }, options.duration || 8e3);
  }
}
function hideFallback() {
  const fallback = _elements.container.querySelector(SELECTORS.FALLBACK);
  if (!fallback) return;
  fallback.classList.add(CSS_CLASSES.FALLBACK_HIDING);
  fallback.classList.remove(CSS_CLASSES.FALLBACK_VISIBLE);
  setTimeout(() => {
    if (fallback.parentNode) {
      fallback.remove();
    }
  }, 300);
}
function show() {
  if (_elements.header) {
    _elements.header.style.display = "";
    _state.visible = true;
  }
}
function hide() {
  if (_elements.header) {
    _elements.header.style.display = "none";
    _state.visible = false;
  }
}
function isVisible() {
  return _state.visible;
}
function _debounce(fn, delay) {
  let timeoutId;
  return function() {
    const args = arguments;
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}
function _escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function _emitEvent(eventName, data) {
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(`header:shell:${eventName}`, Object.assign({ timestamp: Date.now() }, data));
  }
}
function getElements() {
  return Object.assign({}, _elements);
}
function getRegion(regionName) {
  return _elements[regionName] || null;
}
function healthCheck() {
  const checks = { mounted: _state.mounted, hasContainer: !!_elements.container, hasHeader: !!_elements.header, visible: _state.visible, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, mounted: _state.mounted, visible: _state.visible, scrolled: _state.scrolled, hasElements: { container: !!_elements.container, header: !!_elements.header, left: !!_elements.left, center: !!_elements.center, right: !!_elements.right }, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
var header_shell_default = { VERSION, MODULE_ID, init, mount, unmount, render, showFallback, hideFallback, show, hide, getElements, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  header_shell_default as default,
  getElements,
  getPorts,
  getRegion,
  healthCheck,
  hide,
  hideFallback,
  info,
  init,
  injectPorts,
  isVisible,
  mount,
  render,
  show,
  showFallback,
  unmount,
  updateComponent
};
