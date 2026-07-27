import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:scroll-manager";
const DIRECTIONS = Object.freeze({ UP: "up", DOWN: "down", LEFT: "left", RIGHT: "right", NONE: "none" });
function createScrollManager(options = {}) {
  const { throttleMs = 100, offsetTop = 0, offsetBottom = 0, smoothBehavior = "smooth" } = options;
  const _logger = createLogger(MODULE_ID);
  const _watchers = /* @__PURE__ */ new Map();
  const _sections = /* @__PURE__ */ new Map();
  let _lastScrollY = 0;
  let _lastScrollX = 0;
  let _direction = DIRECTIONS.NONE;
  let _ticking = false;
  let _enabled = true;
  let _counter = 0;
  let _metrics = { scrollEvents: 0, sectionsReached: 0 };
  function _onScroll() {
    if (!_enabled) return;
    _metrics.scrollEvents++;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    if (scrollY > _lastScrollY) _direction = DIRECTIONS.DOWN;
    else if (scrollY < _lastScrollY) _direction = DIRECTIONS.UP;
    else if (scrollX > _lastScrollX) _direction = DIRECTIONS.RIGHT;
    else if (scrollX < _lastScrollX) _direction = DIRECTIONS.LEFT;
    else _direction = DIRECTIONS.NONE;
    _lastScrollY = scrollY;
    _lastScrollX = scrollX;
    if (!_ticking) {
      requestAnimationFrame(() => {
        _checkWatchers();
        _checkSections();
        _ticking = false;
      });
      _ticking = true;
    }
  }
  function _checkWatchers() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    _watchers.forEach((config, id) => {
      const rect = config.element.getBoundingClientRect();
      const isVisible = rect.top < viewportHeight - Number(offsetBottom) && rect.bottom > Number(offsetTop) && rect.left < viewportWidth && rect.right > 0;
      if (isVisible !== config.wasVisible) {
        config.wasVisible = isVisible;
        if (isVisible) config.onEnter?.(config.element, rect);
        else config.onLeave?.(config.element, rect);
      }
      if (isVisible && config.onVisible) {
        const visiblePercent = Math.min(1, Math.max(0, (Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)) / rect.height));
        config.onVisible(config.element, visiblePercent, rect);
      }
    });
  }
  function _checkSections() {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const threshold = viewportHeight * 0.3;
    _sections.forEach((config, id) => {
      const rect = config.element.getBoundingClientRect();
      const isActive = rect.top <= threshold && rect.bottom > threshold;
      if (isActive !== config.isActive) {
        config.isActive = isActive;
        if (isActive) {
          config.onActivate?.(config.element, id);
          _metrics.sectionsReached++;
        } else {
          config.onDeactivate?.(config.element, id);
        }
      }
    });
  }
  window.addEventListener("scroll", _onScroll, { passive: true });
  const manager = {
    // Scroll para elemento
    scrollTo(target, options2 = {}) {
      let element = typeof target === "string" ? document.querySelector(target) : target;
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const offset = options2.offset ?? offsetTop;
      const top = rect.top + window.scrollY - Number(offset);
      window.scrollTo({ top, left: options2.left ?? 0, behavior: options2.smooth !== false ? smoothBehavior : "auto" });
      return true;
    },
    // Scroll para topo
    scrollToTop(options2 = {}) {
      window.scrollTo({ top: 0, behavior: options2.smooth !== false ? smoothBehavior : "auto" });
    },
    // Scroll para fim
    scrollToBottom(options2 = {}) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: options2.smooth !== false ? smoothBehavior : "auto" });
    },
    // Observa elemento
    watch(element, callbacks = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const id = `watch-${++_counter}`;
      _watchers.set(id, { element, wasVisible: false, onEnter: callbacks.onEnter, onLeave: callbacks.onLeave, onVisible: callbacks.onVisible });
      return id;
    },
    unwatch(id) {
      return _watchers.delete(id);
    },
    // Registra seção navegável
    registerSection(element, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const id = options2.id || element.id || `section-${++_counter}`;
      _sections.set(id, { element, isActive: false, onActivate: options2.onActivate, onDeactivate: options2.onDeactivate });
      return id;
    },
    unregisterSection(id) {
      return _sections.delete(id);
    },
    getActiveSection() {
      for (const [id, config] of _sections) {
        if (config.isActive) return id;
      }
      return null;
    },
    // Scroll infinito
    onReachBottom(callback, options2 = {}) {
      const threshold = options2.threshold || 200;
      const id = `infinite-${++_counter}`;
      let loading = false;
      const handler = () => {
        if (loading) return;
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;
        if (scrollHeight - scrollTop - clientHeight < Number(threshold)) {
          loading = true;
          Promise.resolve(callback()).finally(() => {
            loading = false;
          });
        }
      };
      window.addEventListener("scroll", handler, { passive: true });
      _watchers.set(id, { handler, type: "infinite" });
      return id;
    },
    // Getters
    getScrollPosition() {
      return { x: window.scrollX, y: window.scrollY };
    },
    getDirection() {
      return _direction;
    },
    getScrollPercent() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      return docHeight > 0 ? Math.round(window.scrollY / docHeight * 100) : 0;
    },
    isAtTop() {
      return window.scrollY <= Number(offsetTop);
    },
    isAtBottom() {
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - Number(offsetBottom);
    },
    enable() {
      _enabled = true;
    },
    disable() {
      _enabled = false;
    },
    getMetrics() {
      return { ..._metrics, watchers: _watchers.size, sections: _sections.size };
    },
    resetMetrics() {
      _metrics = { scrollEvents: 0, sectionsReached: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, watchers: _watchers.size, sections: _sections.size, enabled: _enabled, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, watchers: _watchers.size, sections: _sections.size, directions: Object.keys(DIRECTIONS) };
    },
    destroy() {
      window.removeEventListener("scroll", _onScroll);
      _watchers.forEach((w) => {
        if (w.handler) window.removeEventListener("scroll", w.handler);
      });
      _watchers.clear();
      _sections.clear();
    }
  };
  return manager;
}
let _instance = null;
function getScrollManager(options = {}) {
  if (!_instance) _instance = createScrollManager(options);
  return _instance;
}
function resetScrollManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function scrollTo(target, options) {
  return getScrollManager().scrollTo(target, options);
}
function scrollToTop(options) {
  return getScrollManager().scrollToTop(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, directions: Object.keys(DIRECTIONS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var scroll_manager_default = { VERSION, MODULE_ID, DIRECTIONS, createScrollManager, getScrollManager, resetScrollManager, scrollTo, scrollToTop, info, healthCheck };
export {
  DIRECTIONS,
  MODULE_ID,
  VERSION,
  createScrollManager,
  scroll_manager_default as default,
  getScrollManager,
  healthCheck,
  info,
  resetScrollManager,
  scrollTo,
  scrollToTop
};
