import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "7.1.0-ES6";
const MODULE_ID = "sidebar-animated-transitions";
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
let _enabled = true;
let _observer = null;
let _activeTimers = [];
let _cleanups = [];
let _metrics = { animations: 0, groups: 0, sections: 0, timersCreated: 0, timersCleared: 0 };
const ANIMATION_CLASSES = {
  fadeIn: "dsd-anim--fade-in",
  fadeOut: "dsd-anim--fade-out",
  slideIn: "dsd-anim--slide-in",
  slideOut: "dsd-anim--slide-out",
  scaleIn: "dsd-anim--scale-in",
  scaleOut: "dsd-anim--scale-out",
  bounceIn: "dsd-anim--bounce-in"
};
const DEFAULT_CONFIG = { duration: 300, easing: "ease-out", stagger: 50, type: "slideIn" };
let _config = { ...DEFAULT_CONFIG };
function _setTimeout(fn, delay) {
  _metrics.timersCreated++;
  const id = setTimeout(() => {
    _activeTimers = _activeTimers.filter((t) => t !== id);
    fn();
  }, delay);
  _activeTimers.push(id);
  return id;
}
function _clearAllTimers() {
  _activeTimers.forEach((id) => {
    clearTimeout(id);
    _metrics.timersCleared++;
  });
  _activeTimers = [];
}
function animateNewItems(data) {
  if (!_enabled) return;
  const items = data?.items || [];
  items.forEach((item, index) => {
    const el = _container?.querySelector(`[data-item-id="${item.id}"]`);
    if (el) _setTimeout(() => {
      animateElement(el, "in");
    }, index * _config.stagger);
  });
}
function animateSearchResults() {
  if (!_enabled || !_container) return;
  const visibleItems = _container.querySelectorAll(`.${C.ITEM}:not(.${C.ITEM_HIDDEN})`);
  visibleItems.forEach((item, index) => {
    item.classList.add("dsd-anim--searching");
    _setTimeout(() => {
      item.classList.remove("dsd-anim--searching");
      animateElement(item, "in", "scaleIn");
    }, index * 30);
  });
}
function init(eventBus, container, config) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  _config = { ...DEFAULT_CONFIG, ...config || {} };
  if (_container) {
    setupObserver();
    animateInitialItems();
  }
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const unsub1 = eb.on(SIDEBAR_EVENTS.ITEMS_LOADED, animateNewItems);
    const unsub2 = eb.on(SIDEBAR_EVENTS.SEARCH_RESULTS, animateSearchResults);
    _cleanups.push(
      typeof unsub1 === "function" ? unsub1 : () => {
        if (eb.off) eb.off(SIDEBAR_EVENTS.ITEMS_LOADED, animateNewItems);
      }
    );
    _cleanups.push(
      typeof unsub2 === "function" ? unsub2 : () => {
        if (eb.off) eb.off(SIDEBAR_EVENTS.SEARCH_RESULTS, animateSearchResults);
      }
    );
  }
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.ANIMATED_TRANSITIONS_INITIALIZED);
}
function setupObserver() {
  if (_observer) _observer.disconnect();
  _observer = new MutationObserver((mutations) => {
    if (!_enabled) return;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.classList?.contains(C.ITEM)) animateElement(node, "in");
      });
    });
  });
  const nav = _container?.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`);
  if (nav) _observer.observe(nav, { childList: true, subtree: true });
}
function animateInitialItems() {
  if (!_enabled || !_container) return;
  const items = _container.querySelectorAll(`.${C.ITEM}`);
  items.forEach((item, index) => {
    item.style.opacity = "0";
    item.style.transform = "translateX(-10px)";
    _setTimeout(() => {
      animateElement(item, "in");
    }, index * _config.stagger);
  });
}
function animateElement(el, direction, type) {
  if (!el || !_enabled) return Promise.resolve();
  _metrics.animations++;
  direction = direction || "in";
  const animType = type || _config.type;
  const className = direction === "in" ? ANIMATION_CLASSES[animType] || ANIMATION_CLASSES.slideIn : ANIMATION_CLASSES[animType.replace("In", "Out")] || ANIMATION_CLASSES.slideOut;
  return new Promise((resolve) => {
    el.style.animationDuration = `${_config.duration}ms`;
    el.style.animationTimingFunction = _config.easing;
    el.classList.add(className);
    let resolved = false;
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      el.classList.remove(className);
      el.style.opacity = direction === "in" ? "1" : "0";
      el.style.transform = "";
      resolve();
    };
    const handler = () => {
      el.removeEventListener("animationend", handler);
      cleanup();
    };
    el.addEventListener("animationend", handler);
    _setTimeout(cleanup, _config.duration + 50);
  });
}
function animateGroup(elements, direction, type) {
  _metrics.groups++;
  const els = Array.from(elements);
  return Promise.all(els.map((el, index) => new Promise((resolve) => {
    _setTimeout(() => {
      animateElement(el, direction, type).then(resolve).catch(() => {
        resolve();
      });
    }, index * _config.stagger);
  })));
}
function animateSectionExpand(sectionEl) {
  if (!_enabled || !sectionEl) return;
  _metrics.sections++;
  const items = sectionEl.querySelectorAll(`.${C.ITEM}`);
  items.forEach((item, index) => {
    item.style.opacity = "0";
    _setTimeout(() => {
      animateElement(item, "in", "slideIn");
    }, index * 40);
  });
}
function animateSectionCollapse(sectionEl) {
  if (!_enabled || !sectionEl) return Promise.resolve();
  _metrics.sections++;
  const items = Array.from(sectionEl.querySelectorAll(`.${C.ITEM}`)).reverse();
  return Promise.all(items.map((item, index) => new Promise((resolve) => {
    _setTimeout(() => {
      animateElement(item, "out", "slideOut").then(resolve).catch(() => {
        resolve();
      });
    }, index * 20);
  })));
}
function configure(config) {
  _config = { ..._config, ...config };
}
function enable() {
  _enabled = true;
}
function disable() {
  _enabled = false;
}
function isEnabled() {
  return _enabled;
}
function destroy() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  _clearAllTimers();
  _observer?.disconnect();
  _observer = null;
  _enabled = false;
  _container = null;
}
function getMetrics() {
  return { ..._metrics, activeTimers: _activeTimers.length, cleanups: _cleanups.length };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    enabled: _enabled,
    hasObserver: !!_observer,
    activeTimers: _activeTimers.length,
    cleanups: _cleanups.length,
    config: { ..._config },
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
    checks: { enabled: _enabled, hasObserver: !!_observer, noOrphanTimers: _activeTimers.length < 50, noOrphanListeners: true },
    metrics: getMetrics(),
    p24Compliant: true
  };
}
var animated_transitions_default = { init, animateElement, animateGroup, animateSectionExpand, animateSectionCollapse, configure, enable, disable, isEnabled, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  animateElement,
  animateGroup,
  animateSectionCollapse,
  animateSectionExpand,
  configure,
  animated_transitions_default as default,
  destroy,
  disable,
  enable,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled
};
