// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-visibility-observer
// PURPOSE: Container-Main Visibility Observer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   observe() — exported function
//   unobserve() — exported function
//   observeOnce() — exported function
//   isVisible() — exported function
//   lazyLoad() — exported function
//   trackVisibility() — exported function
//   observeAll() — exported function
//   getObservedCount() — exported function
//   disconnectAll() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-visibility-observer';

// Shared observer instances by threshold
const _observers = new Map();
const _callbacks = new WeakMap();
let _observedCount = 0;

function _getObserverKey(options: Record<string, unknown>) {
  const { root, rootMargin, threshold } = options;
  // @ts-expect-error TS migration - TS2339
  return `${root?.id || 'viewport'}-${rootMargin}-${JSON.stringify(threshold)}`;
}

function _getOrCreateObserver(options: Record<string, unknown> = {}) {
  const { root = null, rootMargin = '0px', threshold = 0 } = options;
  const key = _getObserverKey({ root, rootMargin, threshold });
  
  if (_observers.has(key)) {
    return _observers.get(key);
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const callbacks = _callbacks.get(entry.target);
      if (callbacks) {
        callbacks.forEach((cb: (...args: unknown[]) => void) => {
          try { cb(entry); } catch (e) {}
        });
      }
    });
  }, { root: root as Document | Element | null, rootMargin: rootMargin as string, threshold: threshold as number | number[] });
  
  _observers.set(key, observer);
  return observer;
}

// Observe an element for visibility changes
export function observe(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  if (!(element instanceof Element)) return false;
  
  const observer = _getOrCreateObserver(options);
  
  // Store callback
  let callbacks = _callbacks.get(element);
  if (!callbacks) {
    callbacks = new Set();
    _callbacks.set(element, callbacks);
  }
  callbacks.add(callback);
  
  observer.observe(element);
  _observedCount++;
  
  // Return unobserve function
  return () => unobserve(element, callback, options);
}

// Stop observing an element
export function unobserve(element: HTMLElement, callback: ((...args: unknown[]) => void) | null = null, options: Record<string, unknown> = {}) {
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

// Observe once (auto-unobserve after first intersection)
export function observeOnce(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  const { triggerOnVisible = true } = options;
  
  const wrappedCallback = (entry: Record<string, unknown>) => {
    if (triggerOnVisible && !entry.isIntersecting) return;
    if (!triggerOnVisible && entry.isIntersecting) return;
    
    callback(entry);
    // @ts-expect-error strict migration — TS2345
    unobserve(element, wrappedCallback, options);
  };
  
  // @ts-expect-error strict migration — TS2345
  return observe(element, wrappedCallback, options);
}

// Check if element is currently visible
export function isVisible(element: HTMLElement, threshold = 0) {
  if (!(element instanceof Element)) return false;
  
  return new Promise((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      observer.disconnect();
      resolve(entries[0]?.isIntersecting || false);
    }, { threshold });
    observer.observe(element);
  });
}

// Lazy load elements when they become visible
export function lazyLoad(elements: unknown, loadFn: unknown, options: Record<string, unknown> = {}) {
  const { rootMargin = '100px', threshold = 0 } = options;
  const unobservers: unknown[] = [];
  
  const nodeList = typeof elements === 'string' 
    ? document.querySelectorAll(elements) 
    : elements;
  
  // @ts-expect-error strict migration — TS2345
  (nodeList as unknown[]).forEach((element: HTMLElement) => {
    // @ts-expect-error strict migration — TS2345
    const unobserve = observeOnce(element, (entry: Record<string, unknown>) => {
      (loadFn as (...args: unknown[]) => unknown)(entry.target, entry);
    }, { rootMargin, threshold, triggerOnVisible: true });
    unobservers.push(unobserve);
  });
  
  return () => unobservers.forEach(fn => (fn as (...args: unknown[]) => unknown)());
}

// Track viewport percentage of element
export function trackVisibility(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  const { steps = 4 } = options;
  const threshold = Array.from({ length: Number(steps) + 1 }, (_, i) => i / Number(steps));
  
  // @ts-expect-error strict migration — TS2345
  return observe(element, (entry: Record<string, unknown>) => {
    callback({
      element: entry.target,
      ratio: entry.intersectionRatio,
      percentage: Math.round((entry.intersectionRatio as number) * 100),
      isVisible: entry.isIntersecting,
      bounds: entry.boundingClientRect
    });
  }, { ...options, threshold });
}

// Observe multiple elements with single callback
export function observeAll(elements: unknown, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  const unobservers: unknown[] = [];
  
  const nodeList = typeof elements === 'string'
    ? document.querySelectorAll(elements)
    : elements;
  
  // @ts-expect-error strict migration — TS2345
  (nodeList as unknown[]).forEach((element: HTMLElement) => {
    unobservers.push(observe(element, callback, options));
  });
  
  return () => unobservers.forEach(fn => (fn as (...args: unknown[]) => unknown)());
}

// Get count of observed elements
export function getObservedCount() {
  return _observedCount;
}

// Disconnect all observers
export function disconnectAll() {
  _observers.forEach(observer => observer.disconnect());
  _observers.clear();
  _observedCount = 0;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, observerCount: _observers.size, observedElements: _observedCount };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, observerCount: _observers.size, observedElements: _observedCount };
}

export default {
  observe, unobserve, observeOnce, isVisible, lazyLoad, trackVisibility, observeAll,
  getObservedCount, disconnectAll,
  info, healthCheck, VERSION, MODULE_ID
};
