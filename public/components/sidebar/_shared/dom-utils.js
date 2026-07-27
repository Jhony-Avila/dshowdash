const VERSION = "5.5.0-ENTERPRISE-FULL";
const MODULE_ID = "sidebar-dom-utils";
let _metrics = { creates: 0, queries: 0, delegates: 0 };
function createElement(tag, attrs = {}, children = []) {
  _metrics.creates++;
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "className") el.className = value;
    else if (key === "style" && typeof value === "object") Object.assign(el.style, value);
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key.startsWith("data")) el.dataset[key.slice(4).toLowerCase()] = value;
    else if (key === "aria") Object.entries(value).forEach(([ariaKey, ariaVal]) => el.setAttribute(`aria-${ariaKey}`, ariaVal));
    else el.setAttribute(key, value);
  });
  children.forEach((child) => {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  });
  return el;
}
function $(selector, context = document) {
  _metrics.queries++;
  return context.querySelector(selector);
}
function $$(selector, context = document) {
  _metrics.queries++;
  return Array.from(context.querySelectorAll(selector));
}
function addClass(el, ...classes) {
  el?.classList?.add(...classes.filter(Boolean));
}
function removeClass(el, ...classes) {
  el?.classList?.remove(...classes.filter(Boolean));
}
function toggleClass(el, className, force) {
  return el?.classList?.toggle(className, force);
}
function hasClass(el, className) {
  return el?.classList?.contains(className) ?? false;
}
function setAttrs(el, attrs) {
  if (!el) return;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === void 0) el.removeAttribute(key);
    else el.setAttribute(key, String(value));
  });
}
function setStyles(el, styles) {
  if (!el) return;
  Object.assign(el.style, styles);
}
function getData(el, key) {
  return el?.dataset?.[key];
}
function setData(el, key, value) {
  if (el?.dataset) el.dataset[key] = value;
}
function delegate(container, selector, event, handler) {
  _metrics.delegates++;
  const listener = (e) => {
    const target = e.target.closest(selector);
    if (target && container.contains(target)) handler.call(target, e, target);
  };
  container.addEventListener(event, listener);
  return () => container.removeEventListener(event, listener);
}
function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
function throttle(fn, limit = 150) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function rafThrottle(fn) {
  let ticking = false;
  return (...args) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        fn(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
}
function waitForElement(selector, timeout = 5e3, context = document) {
  return new Promise((resolve, reject) => {
    const el = context.querySelector(selector);
    if (el) return resolve(el);
    const observer = new MutationObserver((mutations, obs) => {
      const el2 = context.querySelector(selector);
      if (el2) {
        obs.disconnect();
        resolve(el2);
      }
    });
    observer.observe(context, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}
function scrollIntoView(el, options = {}) {
  el?.scrollIntoView({ behavior: "smooth", block: "nearest", ...options });
}
function isVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
function isInViewport(el, threshold = 0) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top >= -threshold && rect.left >= -threshold && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold && rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { domAvailable: typeof document !== "undefined" }, metrics: getMetrics() };
}
var dom_utils_default = { createElement, $, $$, addClass, removeClass, toggleClass, hasClass, setAttrs, setStyles, getData, setData, delegate, debounce, throttle, rafThrottle, waitForElement, scrollIntoView, isVisible, isInViewport, healthCheck, info, getMetrics, VERSION, MODULE_ID };
export {
  $,
  $$,
  MODULE_ID,
  VERSION,
  addClass,
  createElement,
  debounce,
  dom_utils_default as default,
  delegate,
  getData,
  getMetrics,
  hasClass,
  healthCheck,
  info,
  isInViewport,
  isVisible,
  rafThrottle,
  removeClass,
  scrollIntoView,
  setAttrs,
  setData,
  setStyles,
  throttle,
  toggleClass,
  waitForElement
};
