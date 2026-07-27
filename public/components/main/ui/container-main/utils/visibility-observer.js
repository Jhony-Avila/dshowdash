const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-visibility-observer";
const _observers = /* @__PURE__ */ new Map();
const _callbacks = /* @__PURE__ */ new WeakMap();
let _observedCount = 0;
function _getObserverKey(options) {
  const { root, rootMargin, threshold } = options;
  return `${root?.id || "viewport"}-${rootMargin}-${JSON.stringify(threshold)}`;
}
function _getOrCreateObserver(options = {}) {
  const { root = null, rootMargin = "0px", threshold = 0 } = options;
  const key = _getObserverKey({ root, rootMargin, threshold });
  if (_observers.has(key)) {
    return _observers.get(key);
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const callbacks = _callbacks.get(entry.target);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb(entry);
          } catch (e) {
          }
        });
      }
    });
  }, { root, rootMargin, threshold });
  _observers.set(key, observer);
  return observer;
}
function observe(element, callback, options = {}) {
  if (!(element instanceof Element)) return false;
  const observer = _getOrCreateObserver(options);
  let callbacks = _callbacks.get(element);
  if (!callbacks) {
    callbacks = /* @__PURE__ */ new Set();
    _callbacks.set(element, callbacks);
  }
  callbacks.add(callback);
  observer.observe(element);
  _observedCount++;
  return () => unobserve(element, callback, options);
}
function unobserve(element, callback = null, options = {}) {
  if (!(element instanceof Element)) return false;
  const callbacks = _callbacks.get(element);
  if (!callbacks) return false;
  if (callback) {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      _callbacks.delete(element);
      const observer = _getOrCreateObserver(options);
      observer.unobserve(element);
      _observedCount--;
    }
  } else {
    _callbacks.delete(element);
    const observer = _getOrCreateObserver(options);
    observer.unobserve(element);
    _observedCount -= callbacks.size;
  }
  return true;
}
function observeOnce(element, callback, options = {}) {
  const { triggerOnVisible = true } = options;
  const wrappedCallback = (entry) => {
    if (triggerOnVisible && !entry.isIntersecting) return;
    if (!triggerOnVisible && entry.isIntersecting) return;
    callback(entry);
    unobserve(element, wrappedCallback, options);
  };
  return observe(element, wrappedCallback, options);
}
function isVisible(element, threshold = 0) {
  if (!(element instanceof Element)) return false;
  return new Promise((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      observer.disconnect();
      resolve(entries[0]?.isIntersecting || false);
    }, { threshold });
    observer.observe(element);
  });
}
function lazyLoad(elements, loadFn, options = {}) {
  const { rootMargin = "100px", threshold = 0 } = options;
  const unobservers = [];
  const nodeList = typeof elements === "string" ? document.querySelectorAll(elements) : elements;
  nodeList.forEach((element) => {
    const unobserve2 = observeOnce(element, (entry) => {
      loadFn(entry.target, entry);
    }, { rootMargin, threshold, triggerOnVisible: true });
    unobservers.push(unobserve2);
  });
  return () => unobservers.forEach((fn) => fn());
}
function trackVisibility(element, callback, options = {}) {
  const { steps = 4 } = options;
  const threshold = Array.from({ length: Number(steps) + 1 }, (_, i) => i / Number(steps));
  return observe(element, (entry) => {
    callback({
      element: entry.target,
      ratio: entry.intersectionRatio,
      percentage: Math.round(entry.intersectionRatio * 100),
      isVisible: entry.isIntersecting,
      bounds: entry.boundingClientRect
    });
  }, { ...options, threshold });
}
function observeAll(elements, callback, options = {}) {
  const unobservers = [];
  const nodeList = typeof elements === "string" ? document.querySelectorAll(elements) : elements;
  nodeList.forEach((element) => {
    unobservers.push(observe(element, callback, options));
  });
  return () => unobservers.forEach((fn) => fn());
}
function getObservedCount() {
  return _observedCount;
}
function disconnectAll() {
  _observers.forEach((observer) => observer.disconnect());
  _observers.clear();
  _observedCount = 0;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, observerCount: _observers.size, observedElements: _observedCount };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, observerCount: _observers.size, observedElements: _observedCount };
}
var visibility_observer_default = {
  observe,
  unobserve,
  observeOnce,
  isVisible,
  lazyLoad,
  trackVisibility,
  observeAll,
  getObservedCount,
  disconnectAll,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  visibility_observer_default as default,
  disconnectAll,
  getObservedCount,
  healthCheck,
  info,
  isVisible,
  lazyLoad,
  observe,
  observeAll,
  observeOnce,
  trackVisibility,
  unobserve
};
