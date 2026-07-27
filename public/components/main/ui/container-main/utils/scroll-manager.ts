// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:scroll-manager
// PURPOSE: Scroll Manager - Gerenciamento de scroll e navegação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DIRECTIONS — exported value
//   createScrollManager() — exported function
//   getScrollManager() — exported function
//   resetScrollManager() — exported function
//   scrollTo() — exported function
//   scrollToTop() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'scroll'
// WINDOW ACCESS:
//   window.addEventListener
//   window.innerHeight
//   window.innerWidth
//   window.removeEventListener
//   window.scrollTo
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:scroll-manager';

export const DIRECTIONS = Object.freeze({ UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right', NONE: 'none' });

export function createScrollManager(options: Record<string, unknown> = {}) {
  const { throttleMs = 100, offsetTop = 0, offsetBottom = 0, smoothBehavior = 'smooth' } = options;

  const _logger = createLogger(MODULE_ID);
  const _watchers = new Map();
  const _sections = new Map();
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


    // @ts-expect-error TS migration - TS2322
    if (scrollY > _lastScrollY) _direction = DIRECTIONS.DOWN;

    // @ts-expect-error TS migration - TS2322
    else if (scrollY < _lastScrollY) _direction = DIRECTIONS.UP;

    // @ts-expect-error TS migration - TS2322
    else if (scrollX > _lastScrollX) _direction = DIRECTIONS.RIGHT;

    // @ts-expect-error TS migration - TS2322
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

  window.addEventListener('scroll', _onScroll, { passive: true });

  const manager = {
    // Scroll para elemento
    scrollTo(target: HTMLElement, options: Record<string, unknown> = {}) {
      let element = typeof target === 'string' ? document.querySelector(target) : target;
      if (!element) return false;

      const rect = element.getBoundingClientRect();
      const offset = options.offset ?? offsetTop;
      const top = rect.top + window.scrollY - Number(offset);

      window.scrollTo({ top, left: (options.left as number) ?? 0, behavior: (options.smooth !== false ? smoothBehavior : 'auto') as ScrollBehavior });
      return true;
    },

    // Scroll para topo
    scrollToTop(options: Record<string, unknown> = {}) {
      window.scrollTo({ top: 0, behavior: (options.smooth !== false ? smoothBehavior : 'auto') as ScrollBehavior });
    },

    // Scroll para fim
    scrollToBottom(options: Record<string, unknown> = {}) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: (options.smooth !== false ? smoothBehavior : 'auto') as ScrollBehavior });
    },

    // Observa elemento
    watch(element: HTMLElement, callbacks: Record<string, unknown> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      const id = `watch-${++_counter}`;
      _watchers.set(id, { element, wasVisible: false, onEnter: callbacks.onEnter, onLeave: callbacks.onLeave, onVisible: callbacks.onVisible });
      return id;
    },

    unwatch(id: string) { return _watchers.delete(id); },

    // Registra seção navegável
    registerSection(element: HTMLElement, options: Record<string, unknown> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      const id = options.id || element.id || `section-${++_counter}`;
      _sections.set(id, { element, isActive: false, onActivate: options.onActivate, onDeactivate: options.onDeactivate });
      return id;
    },

    unregisterSection(id: string) { return _sections.delete(id); },
    getActiveSection() { for (const [id, config] of _sections) { if (config.isActive) return id; } return null; },

    // Scroll infinito
    onReachBottom(callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
      const threshold = options.threshold || 200;
      const id = `infinite-${++_counter}`;
      let loading = false;

      const handler = () => {
        if (loading) return;
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;

        if (scrollHeight - scrollTop - clientHeight < Number(threshold)) {
          loading = true;
          Promise.resolve(callback()).finally(() => { loading = false; });
        }
      };

      window.addEventListener('scroll', handler, { passive: true });
      _watchers.set(id, { handler, type: 'infinite' });
      return id;
    },

    // Getters
    getScrollPosition() { return { x: window.scrollX, y: window.scrollY }; },
    getDirection() { return _direction; },
    getScrollPercent() { const docHeight = document.documentElement.scrollHeight - window.innerHeight; return docHeight > 0 ? Math.round((window.scrollY / docHeight) * 100) : 0; },
    isAtTop() { return window.scrollY <= Number(offsetTop); },
    isAtBottom() { return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - Number(offsetBottom); },

    enable() { _enabled = true; },
    disable() { _enabled = false; },

    getMetrics() { return { ..._metrics, watchers: _watchers.size, sections: _sections.size }; },
    resetMetrics() { _metrics = { scrollEvents: 0, sectionsReached: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, watchers: _watchers.size, sections: _sections.size, enabled: _enabled, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, watchers: _watchers.size, sections: _sections.size, directions: Object.keys(DIRECTIONS) }; },

    destroy() {
      window.removeEventListener('scroll', _onScroll);
      _watchers.forEach(w => { if (w.handler) window.removeEventListener('scroll', w.handler); });
      _watchers.clear();
      _sections.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getScrollManager(options: Record<string, unknown> = {}) { if (!_instance) _instance = createScrollManager(options); return _instance; }
export function resetScrollManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function scrollTo(target: HTMLElement, options: Record<string, unknown>) { return (getScrollManager().scrollTo as (...args: unknown[]) => unknown)(target, options); }
export function scrollToTop(options: Record<string, unknown>) { return (getScrollManager().scrollToTop as (...args: unknown[]) => unknown)(options); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, directions: Object.keys(DIRECTIONS) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, DIRECTIONS, createScrollManager, getScrollManager, resetScrollManager, scrollTo, scrollToTop, info, healthCheck };
