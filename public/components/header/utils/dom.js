import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.5.0-ES6";
const MODULE_ID = "header/utils/dom";
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
let _debug = false;
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return _debug || cfg && cfg.app && cfg.app.debug;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(...[prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};
let _metrics = { escapeHtmlCalls: 0, debounceCreated: 0, throttleCreated: 0, waitForElementCalls: 0 };
function DOMHelpers() {
}
DOMHelpers.escapeHtml = (text) => {
  _metrics.escapeHtmlCalls++;
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};
DOMHelpers.getVisibleElements = (container, selector) => {
  if (!container) return [];
  return Array.from(container.querySelectorAll(selector)).filter((el) => el.offsetParent !== null);
};
DOMHelpers.setAttributes = (element, attrs) => {
  if (!element) return;
  Object.entries(attrs).forEach((entry) => {
    const key = entry[0];
    const value = entry[1];
    if (value === null || value === void 0) element.removeAttribute(key);
    else element.setAttribute(key, String(value));
  });
};
DOMHelpers.addClass = function(element) {
  if (!element) return;
  element.classList.add(...Array.prototype.slice.call(arguments, 1));
};
DOMHelpers.removeClass = function(element) {
  if (!element) return;
  element.classList.remove(...Array.prototype.slice.call(arguments, 1));
};
DOMHelpers.toggleClass = (element, className, force) => {
  if (!element) return;
  return element.classList.toggle(className, force);
};
DOMHelpers.debounce = (fn, delay) => {
  _metrics.debounceCreated++;
  let timer;
  const debounced = function() {
    const args = arguments;
    const self = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(self, args);
    }, delay);
  };
  debounced.cancel = () => {
    clearTimeout(timer);
  };
  return debounced;
};
DOMHelpers.throttle = (fn, delay) => {
  _metrics.throttleCreated++;
  let lastCall = 0;
  let timer = null;
  const throttled = function() {
    const args = arguments;
    const self = this;
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn.apply(self, args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(self, args);
      }, delay - timeSinceLastCall);
    }
  };
  throttled.cancel = () => {
    clearTimeout(timer);
  };
  return throttled;
};
DOMHelpers.waitForElement = (selector, timeout) => {
  timeout = timeout || 5e3;
  _metrics.waitForElementCalls++;
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(element);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};
DOMHelpers.median = (arr) => {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
DOMHelpers.mad = (arr) => {
  if (arr.length === 0) return 0;
  const med = DOMHelpers.median(arr);
  const deviations = arr.map((v) => Math.abs(v - med));
  return DOMHelpers.median(deviations);
};
DOMHelpers.clamp = (value, min, max) => Math.max(min, Math.min(max, value));
DOMHelpers.lerp = (start, end, t) => start + (end - start) * DOMHelpers.clamp(t, 0, 1);
DOMHelpers.getMetrics = () => Object.assign({}, _metrics);
DOMHelpers.resetMetrics = () => {
  _metrics = { escapeHtmlCalls: 0, debounceCreated: 0, throttleCreated: 0, waitForElementCalls: 0 };
};
DOMHelpers.healthCheck = () => {
  const logger = _getPort("logger");
  const checks = { documentReady: document.readyState !== "loading", bodyExists: !!document.body, loggerAvailable: !!logger };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
DOMHelpers.info = () => ({
  version: VERSION,
  moduleId: MODULE_ID,
  portsInitialized: Ports.isInitialized(),
  metrics: DOMHelpers.getMetrics(),
  healthCheck: DOMHelpers.healthCheck()
});
function getVersion() {
  return VERSION;
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getMetrics() {
  return DOMHelpers.getMetrics();
}
function healthCheck() {
  return DOMHelpers.healthCheck();
}
function info() {
  return DOMHelpers.info();
}
var dom_default = DOMHelpers;
export {
  DOMHelpers,
  MODULE_ID,
  VERSION,
  dom_default as default,
  getMetrics,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  setDebug
};
