import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:intersection-manager";
function createIntersectionManager(options = {}) {
  const { rootMargin = "50px", threshold = [0, 0.25, 0.5, 0.75, 1], defaultOnce = false } = options;
  const _logger = createLogger(MODULE_ID);
  const _observers = /* @__PURE__ */ new Map();
  const _entries = /* @__PURE__ */ new Map();
  let _counter = 0;
  let _metrics = { observed: 0, intersected: 0, lazyLoaded: 0 };
  function _createObserver(options2 = {}) {
    const key = JSON.stringify(options2);
    if (_observers.has(key)) return _observers.get(key);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const config = _entries.get(entry.target);
        if (!config) return;
        if (entry.isIntersecting) {
          _metrics.intersected++;
          config.onEnter?.(entry.target, entry);
          if (config.once) {
            observer.unobserve(entry.target);
            _entries.delete(entry.target);
          }
        } else {
          config.onLeave?.(entry.target, entry);
        }
        config.onChange?.(entry.target, entry.isIntersecting, entry);
      });
    }, { root: options2.root || null, rootMargin: options2.rootMargin || rootMargin, threshold: options2.threshold || threshold });
    _observers.set(key, observer);
    return observer;
  }
  const manager = {
    observe(element, callbacks = {}, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const id = `obs-${++_counter}`;
      const observer = _createObserver(options2);
      const config = { id, onEnter: callbacks.onEnter, onLeave: callbacks.onLeave, onChange: callbacks.onChange, once: callbacks.once ?? defaultOnce };
      _entries.set(element, config);
      observer.observe(element);
      _metrics.observed++;
      return id;
    },
    unobserve(element) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element || !_entries.has(element)) return false;
      _observers.forEach((observer) => observer.unobserve(element));
      _entries.delete(element);
      return true;
    },
    // Lazy loading de imagens
    lazyLoad(selector = "img[data-src]", options2 = {}) {
      const images = typeof selector === "string" ? document.querySelectorAll(selector) : [selector];
      const ids = [];
      images.forEach((img) => {
        const id = this.observe(img, {
          onEnter: (el) => {
            const src = el.dataset.src;
            const srcset = el.dataset.srcset;
            if (src) {
              el.src = src;
              delete el.dataset.src;
            }
            if (srcset) {
              el.srcset = srcset;
              delete el.dataset.srcset;
            }
            el.classList.add("lazy-loaded");
            _metrics.lazyLoaded++;
            options2.onLoad?.(el);
          },
          once: true
        }, { rootMargin: options2.rootMargin || "100px", threshold: options2.threshold || 0 });
        ids.push(id);
      });
      return ids;
    },
    // Infinite scroll
    infiniteScroll(sentinel, loadMore, options2 = {}) {
      if (typeof sentinel === "string") sentinel = document.querySelector(sentinel);
      if (!sentinel) return null;
      let loading = false;
      return this.observe(sentinel, {
        onEnter: async () => {
          if (loading) return;
          loading = true;
          try {
            const hasMore = await loadMore();
            if (hasMore === false) {
              this.unobserve(sentinel);
              options2.onEnd?.();
            }
          } catch (e) {
            _logger.error("Infinite scroll error:", e);
            options2.onError?.(e);
          } finally {
            loading = false;
          }
        }
      }, { rootMargin: options2.rootMargin || "200px", threshold: 0 });
    },
    // Animação ao entrar na viewport
    animateOnScroll(selector, animationClass = "animate-in", options2 = {}) {
      const elements = document.querySelectorAll(selector);
      const ids = [];
      elements.forEach((el, index) => {
        const id = this.observe(el, {
          onEnter: () => {
            if (options2.stagger) {
              setTimeout(() => el.classList.add(animationClass), index * (options2.staggerDelay || 100));
            } else {
              el.classList.add(animationClass);
            }
          },
          onLeave: options2.repeat ? () => el.classList.remove(animationClass) : void 0,
          once: !options2.repeat
        }, { threshold: options2.threshold || 0.1 });
        ids.push(id);
      });
      return ids;
    },
    // Analytics de visibilidade
    trackVisibility(element, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const stats = { totalTime: 0, viewCount: 0, lastEnter: null, maxVisibleRatio: 0 };
      return this.observe(element, {
        onEnter: () => {
          stats.viewCount++;
          stats.lastEnter = Date.now();
          options2.onView?.(stats);
        },
        onLeave: () => {
          if (stats.lastEnter) {
            stats.totalTime += Date.now() - stats.lastEnter;
            stats.lastEnter = null;
          }
          options2.onLeave?.(stats);
        },
        onChange: (el, visible, entry) => {
          if (entry.intersectionRatio > stats.maxVisibleRatio) {
            stats.maxVisibleRatio = entry.intersectionRatio;
          }
        }
      }, options2);
    },
    getMetrics() {
      return { ..._metrics, activeObservers: _observers.size, observedElements: _entries.size };
    },
    resetMetrics() {
      _metrics = { observed: 0, intersected: 0, lazyLoaded: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, observers: _observers.size, entries: _entries.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, observers: _observers.size, entries: _entries.size };
    },
    destroy() {
      _observers.forEach((observer) => observer.disconnect());
      _observers.clear();
      _entries.clear();
    }
  };
  return manager;
}
let _instance = null;
function getIntersectionManager(options = {}) {
  if (!_instance) _instance = createIntersectionManager(options);
  return _instance;
}
function resetIntersectionManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function lazyLoad(selector, options) {
  return getIntersectionManager().lazyLoad(selector, options);
}
function observe(element, callbacks, options) {
  return getIntersectionManager().observe(element, callbacks, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var intersection_manager_default = { VERSION, MODULE_ID, createIntersectionManager, getIntersectionManager, resetIntersectionManager, lazyLoad, observe, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createIntersectionManager,
  intersection_manager_default as default,
  getIntersectionManager,
  healthCheck,
  info,
  lazyLoad,
  observe,
  resetIntersectionManager
};
