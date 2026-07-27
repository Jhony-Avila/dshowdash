// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:intersection-manager
// PURPOSE: Intersection Manager - Observador de visibilidade de elementos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createIntersectionManager() — exported function
//   getIntersectionManager() — exported function
//   resetIntersectionManager() — exported function
//   lazyLoad() — exported function
//   observe() — exported function
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

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:intersection-manager';

export function createIntersectionManager(options: Record<string, any> = {}) {
  const { rootMargin = '50px', threshold = [0, 0.25, 0.5, 0.75, 1], defaultOnce = false } = options;

  const _logger = createLogger(MODULE_ID);
  const _observers = new Map();
  const _entries = new Map();
  let _counter = 0;
  let _metrics = { observed: 0, intersected: 0, lazyLoaded: 0 };

  function _createObserver(options: Record<string, any> = {}) {
    const key = JSON.stringify(options);
    if (_observers.has(key)) return _observers.get(key);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
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
    }, { root: options.root || null, rootMargin: options.rootMargin || rootMargin, threshold: options.threshold || threshold });

    _observers.set(key, observer);
    return observer;
  }

  const manager = {
    observe(element: HTMLElement, callbacks: Record<string, any> = {}, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      const id = `obs-${++_counter}`;
      const observer = _createObserver(options);
      const config = { id, onEnter: callbacks.onEnter, onLeave: callbacks.onLeave, onChange: callbacks.onChange, once: callbacks.once ?? defaultOnce };

      _entries.set(element, config);
      observer.observe(element);
      _metrics.observed++;

      return id;
    },

    unobserve(element: HTMLElement) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element || !_entries.has(element)) return false;

      _observers.forEach(observer => observer.unobserve(element));
      _entries.delete(element);
      return true;
    },

    // Lazy loading de imagens
    lazyLoad(selector = 'img[data-src]', options: Record<string, any> = {}) {
      const images = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector];
      const ids: unknown[] = [];

      images.forEach(img => {
        // @ts-expect-error strict migration — TS2345
        const id = this.observe(img, {
          onEnter: (el: HTMLElement) => {
            const src = el.dataset.src;
            const srcset = el.dataset.srcset;
            // @ts-expect-error TS migration - TS2339
            if (src) { el.src = src; delete el.dataset.src; }
            // @ts-expect-error TS migration - TS2339
            if (srcset) { el.srcset = srcset; delete el.dataset.srcset; }
            el.classList.add('lazy-loaded');
            _metrics.lazyLoaded++;
            options.onLoad?.(el);
          },
          once: true
        }, { rootMargin: options.rootMargin || '100px', threshold: options.threshold || 0 });
        ids.push(id);
      });

      return ids;
    },

    // Infinite scroll
    infiniteScroll(sentinel: unknown, loadMore: unknown, options: Record<string, any> = {}) {
      if (typeof sentinel === 'string') sentinel = document.querySelector(sentinel);
      if (!sentinel) return null;

      let loading = false;

      // @ts-expect-error strict migration — TS2345
      return this.observe(sentinel, {
        onEnter: async () => {
          if (loading) return;
          loading = true;
          try {
            const hasMore = await (loadMore as (...args: unknown[]) => unknown)();
            if (hasMore === false) {
              // @ts-expect-error strict migration — TS2345
              this.unobserve(sentinel);
              options.onEnd?.();
            }
          } catch (e) {
            _logger.error('Infinite scroll error:', e);
            options.onError?.(e);
          } finally {
            loading = false;
          }
        }
      }, { rootMargin: options.rootMargin || '200px', threshold: 0 });
    },

    // Animação ao entrar na viewport
    animateOnScroll(selector: string, animationClass = 'animate-in', options: Record<string, any> = {}) {
      const elements = document.querySelectorAll(selector);
      const ids: unknown[] = [];

      elements.forEach((el, index) => {
        // @ts-expect-error strict migration — TS2345
        const id = this.observe(el, {
          onEnter: () => {
            if (options.stagger) {
              setTimeout(() => el.classList.add(animationClass), index * (options.staggerDelay || 100));
            } else {
              el.classList.add(animationClass);
            }
          },
          onLeave: options.repeat ? () => el.classList.remove(animationClass) : undefined,
          once: !options.repeat
        }, { threshold: options.threshold || 0.1 });
        ids.push(id);
      });

      return ids;
    },

    // Analytics de visibilidade
    trackVisibility(element: HTMLElement, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      const stats = { totalTime: 0, viewCount: 0, lastEnter: null as Record<string, unknown> | null, maxVisibleRatio: 0 };

      return this.observe(element, {
        onEnter: () => {
          stats.viewCount++;
          // @ts-expect-error TS migration - TS2352
          stats.lastEnter = Date.now() as Record<string, unknown>;
          options.onView?.(stats);
        },
        onLeave: () => {
          if (stats.lastEnter) {
            stats.totalTime += Date.now() - (stats.lastEnter as unknown as number);
            stats.lastEnter = null;
          }
          options.onLeave?.(stats);
        },
        onChange: (el: HTMLElement, visible: boolean, entry: Record<string, unknown>) => {
          if ((entry.intersectionRatio as number) > stats.maxVisibleRatio) {
            stats.maxVisibleRatio = (entry.intersectionRatio) as number;
          }
        }
      }, options);
    },

    getMetrics() { return { ..._metrics, activeObservers: _observers.size, observedElements: _entries.size }; },
    resetMetrics() { _metrics = { observed: 0, intersected: 0, lazyLoaded: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, observers: _observers.size, entries: _entries.size, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, observers: _observers.size, entries: _entries.size }; },

    destroy() {
      _observers.forEach(observer => observer.disconnect());
      _observers.clear();
      _entries.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getIntersectionManager(options: Record<string, any> = {}) { if (!_instance) _instance = createIntersectionManager(options); return _instance; }
export function resetIntersectionManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function lazyLoad(selector: string, options: Record<string, unknown>) { return (getIntersectionManager().lazyLoad as (...args: unknown[]) => unknown)(selector, options); }
export function observe(element: HTMLElement, callbacks: unknown, options: Record<string, unknown>) { return (getIntersectionManager().observe as (...args: unknown[]) => unknown)(element, callbacks, options); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, createIntersectionManager, getIntersectionManager, resetIntersectionManager, lazyLoad, observe, info, healthCheck };
