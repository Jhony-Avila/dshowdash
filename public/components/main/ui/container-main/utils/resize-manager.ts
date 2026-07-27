// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:resize-manager
// PURPOSE: Resize Manager - Observador de redimensionamento de elementos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createResizeManager() — exported function
//   getResizeManager() — exported function
//   resetResizeManager() — exported function
//   observeResize() — exported function
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
export const MODULE_ID = 'container-main:resize-manager';

export function createResizeManager(options: Record<string, any> = {}) {
  const { debounceMs = 100, defaultBox = 'content-box' } = options;

  const _logger = createLogger(MODULE_ID);
  const _entries = new Map();
  let _observer: Record<string, unknown> | null = null;
  let _debounceTimers = new Map();
  let _counter = 0;
  let _metrics = { observed: 0, resized: 0 };

  function _initObserver() {
    if (_observer) return;
    // @ts-expect-error TS migration - TS2322
    _observer = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        const config = _entries.get(entry.target);
        if (!config) return;

        const debounce = config.debounce ?? debounceMs;
        if (debounce > 0) {
          clearTimeout(_debounceTimers.get(config.id));
          // @ts-expect-error TS migration - TS2345
          _debounceTimers.set(config.id, setTimeout(() => _handleResize(entry, config), debounce));
        } else {
          // @ts-expect-error TS migration - TS2345
          _handleResize(entry, config);
        }
      });
    });
  }

  function _handleResize(entry: Record<string, unknown>, config: Record<string, unknown>) {
    _metrics.resized++;
    // @ts-expect-error TS migration - TS2339
    const { width, height } = entry.contentRect;
    const aspectRatio = width / height || 0;
    const data = { width, height, aspectRatio, entry, previousWidth: config.lastWidth, previousHeight: config.lastHeight };

    config.lastWidth = width;
    config.lastHeight = height;
    // @ts-expect-error TS migration - TS2349
    config.callback?.(entry.target, data);
  }

  const manager = {
    observe(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      _initObserver();
      const id = `resize-${++_counter}`;
      const config = { id, callback, debounce: options.debounce, box: options.box || defaultBox, lastWidth: 0, lastHeight: 0 };

      _entries.set(element, config);
      (_observer!.observe as (...args: unknown[]) => unknown)(element, { box: config.box });
      _metrics.observed++;

      return id;
    },

    unobserve(element: HTMLElement) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element || !_entries.has(element)) return false;

      const config = _entries.get(element);
      clearTimeout(_debounceTimers.get(config.id));
      _debounceTimers.delete(config.id);
      // @ts-expect-error TS migration - TS2349, TS2304
      _observer?.(unobserve as (...args: unknown[]) => unknown)(element);
      _entries.delete(element);
      return true;
    },

    // Manter aspect ratio
    maintainAspectRatio(element: HTMLElement, ratio = 16/9, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      const adjust = () => {
        const width = element.offsetWidth;
        const height = width / ratio;
        element.style.height = `${height}px`;
        options.onResize?.({ width, height, ratio });
      };

      adjust();
      return this.observe(element, adjust, options);
    },

    // Container queries (polyfill básico)
    containerQuery(element: HTMLElement, breakpoints: unknown, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;


      // @ts-expect-error strict migration — TS2769, TS2571
      const sorted = Object.entries(breakpoints).sort((a, b) => a[1] - b[1]);

      // @ts-expect-error strict migration — TS2345
      return this.observe(element, (el: HTMLElement, { width }: Record<string, unknown>) => {
        let matched = null;
        for (const [name, minWidth] of sorted) {
          // @ts-expect-error strict migration — TS18046
          if (width >= minWidth) matched = name;
        }

        sorted.forEach(([name]) => el.classList.remove(`container-${name}`));
        if (matched) {
          el.classList.add(`container-${matched}`);
          options.onChange?.(matched, width);
        }
      }, options);
    },

    // Responsive font size
    responsiveText(element: HTMLElement, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      const { minSize = 12, maxSize = 48, scale = 0.05 } = options;

      // @ts-expect-error strict migration — TS2345
      return this.observe(element, (el: HTMLElement, { width }: Record<string, unknown>) => {
        const size = Math.min(maxSize, Math.max(minSize, (width as number) * scale));
        el.style.fontSize = `${size}px`;
      }, options);
    },

    // Get current size
    getSize(element: HTMLElement) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, aspectRatio: rect.width / rect.height };
    },

    getMetrics() { return { ..._metrics, observedElements: _entries.size }; },
    resetMetrics() { _metrics = { observed: 0, resized: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, observedElements: _entries.size, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, observedElements: _entries.size }; },

    destroy() {
      _debounceTimers.forEach(timer => clearTimeout(timer));
      _debounceTimers.clear();
      // @ts-expect-error TS migration - TS2349, TS2304
      _observer?.(disconnect as (...args: unknown[]) => unknown)();
      _observer = null;
      _entries.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getResizeManager(options: Record<string, any> = {}) { if (!_instance) _instance = createResizeManager(options); return _instance; }
export function resetResizeManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function observeResize(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown>) { return (getResizeManager().observe as (...args: unknown[]) => unknown)(element, callback, options); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, createResizeManager, getResizeManager, resetResizeManager, observeResize, info, healthCheck };
