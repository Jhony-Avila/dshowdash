import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:resize-manager";
function createResizeManager(options = {}) {
  const { debounceMs = 100, defaultBox = "content-box" } = options;
  const _logger = createLogger(MODULE_ID);
  const _entries = /* @__PURE__ */ new Map();
  let _observer = null;
  let _debounceTimers = /* @__PURE__ */ new Map();
  let _counter = 0;
  let _metrics = { observed: 0, resized: 0 };
  function _initObserver() {
    if (_observer) return;
    _observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const config = _entries.get(entry.target);
        if (!config) return;
        const debounce = config.debounce ?? debounceMs;
        if (debounce > 0) {
          clearTimeout(_debounceTimers.get(config.id));
          _debounceTimers.set(config.id, setTimeout(() => _handleResize(entry, config), debounce));
        } else {
          _handleResize(entry, config);
        }
      });
    });
  }
  function _handleResize(entry, config) {
    _metrics.resized++;
    const { width, height } = entry.contentRect;
    const aspectRatio = width / height || 0;
    const data = { width, height, aspectRatio, entry, previousWidth: config.lastWidth, previousHeight: config.lastHeight };
    config.lastWidth = width;
    config.lastHeight = height;
    config.callback?.(entry.target, data);
  }
  const manager = {
    observe(element, callback, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      _initObserver();
      const id = `resize-${++_counter}`;
      const config = { id, callback, debounce: options2.debounce, box: options2.box || defaultBox, lastWidth: 0, lastHeight: 0 };
      _entries.set(element, config);
      _observer.observe(element, { box: config.box });
      _metrics.observed++;
      return id;
    },
    unobserve(element) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element || !_entries.has(element)) return false;
      const config = _entries.get(element);
      clearTimeout(_debounceTimers.get(config.id));
      _debounceTimers.delete(config.id);
      _observer?.(unobserve)(element);
      _entries.delete(element);
      return true;
    },
    // Manter aspect ratio
    maintainAspectRatio(element, ratio = 16 / 9, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const adjust = () => {
        const width = element.offsetWidth;
        const height = width / ratio;
        element.style.height = `${height}px`;
        options2.onResize?.({ width, height, ratio });
      };
      adjust();
      return this.observe(element, adjust, options2);
    },
    // Container queries (polyfill básico)
    containerQuery(element, breakpoints, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const sorted = Object.entries(breakpoints).sort((a, b) => a[1] - b[1]);
      return this.observe(element, (el, { width }) => {
        let matched = null;
        for (const [name, minWidth] of sorted) {
          if (width >= minWidth) matched = name;
        }
        sorted.forEach(([name]) => el.classList.remove(`container-${name}`));
        if (matched) {
          el.classList.add(`container-${matched}`);
          options2.onChange?.(matched, width);
        }
      }, options2);
    },
    // Responsive font size
    responsiveText(element, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const { minSize = 12, maxSize = 48, scale = 0.05 } = options2;
      return this.observe(element, (el, { width }) => {
        const size = Math.min(maxSize, Math.max(minSize, width * scale));
        el.style.fontSize = `${size}px`;
      }, options2);
    },
    // Get current size
    getSize(element) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, aspectRatio: rect.width / rect.height };
    },
    getMetrics() {
      return { ..._metrics, observedElements: _entries.size };
    },
    resetMetrics() {
      _metrics = { observed: 0, resized: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, observedElements: _entries.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, observedElements: _entries.size };
    },
    destroy() {
      _debounceTimers.forEach((timer) => clearTimeout(timer));
      _debounceTimers.clear();
      _observer?.(disconnect)();
      _observer = null;
      _entries.clear();
    }
  };
  return manager;
}
let _instance = null;
function getResizeManager(options = {}) {
  if (!_instance) _instance = createResizeManager(options);
  return _instance;
}
function resetResizeManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function observeResize(element, callback, options) {
  return getResizeManager().observe(element, callback, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var resize_manager_default = { VERSION, MODULE_ID, createResizeManager, getResizeManager, resetResizeManager, observeResize, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createResizeManager,
  resize_manager_default as default,
  getResizeManager,
  healthCheck,
  info,
  observeResize,
  resetResizeManager
};
