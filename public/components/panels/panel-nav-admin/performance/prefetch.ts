// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.4.0-MIGRATION-PHASE8)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.performance.prefetch
// PURPOSE: Prefetch — Pré-carregamento de dados ao hover no sidebar
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../config/feature-flags.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   Prefetch — Factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01 prefetch for nav-admin domain
// @changelog
//   10.4.0-MIGRATION-PHASE8: Initial creation — FASE 8 H.2
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../config/feature-flags.js';

export const VERSION = '10.4.0-MIGRATION-PHASE8';
export const MODULE_ID = 'panel-nav-admin.performance.prefetch';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[Prefetch]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Factory: creates a Prefetch manager.
 * Pre-loads navigation data when the admin sidebar item is hovered.
 *
 * @param {Object} [options]
 * @param {number} [options.hoverDelayMs=200] — Delay before triggering prefetch
 * @param {number} [options.ttlMs=30000] — Cache TTL for prefetched data
 * @param {number} [options.maxPrefetches=5] — Max concurrent prefetches
 * @returns {Object} Prefetch instance
 */
export function Prefetch(options: Record<string, unknown> = {}) {
  const {
    hoverDelayMs = 200,
    ttlMs = 30000,
    maxPrefetches = 5
  } = options;

  /** @private */
  const _cache = new Map<string, { data: unknown; timestamp: number }>();
  let _hoverTimer: ReturnType<typeof setTimeout> | null = null;
  let _activePrefetches = 0;
  let _totalPrefetches = 0;
  let _cacheHits = 0;

  /**
   * Prefetch data for a given key using a loader function.
   *
   * @param {string} key — Cache key
   * @param {Function} loader — Async function that returns data
   * @returns {Promise<*>} Loaded data
   */
  async function prefetch(key: string, loader: () => Promise<unknown>) {
    if (!isEnabled('prefetch')) return null;

    // Check cache
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.timestamp < Number(ttlMs)) {
      _cacheHits++;
      _log('debug', `Cache hit for "${key}"`);
      return cached.data;
    }

    // Limit concurrent prefetches
    if (_activePrefetches >= Number(maxPrefetches)) {
      _log('debug', `Max prefetches reached, skipping "${key}"`);
      return null;
    }

    _activePrefetches++;
    _totalPrefetches++;

    try {
      _log('debug', `Prefetching "${key}"...`);
      const data = await loader();
      _cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      _log('error', `Prefetch failed for "${key}":`, err);
      return null;
    } finally {
      _activePrefetches--;
    }
  }

  /**
   * Get cached data if available and not expired.
   *
   * @param {string} key
   * @returns {*|null}
   */
  function getCached(key: string) {
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.timestamp < Number(ttlMs)) {
      _cacheHits++;
      return cached.data;
    }
    return null;
  }

  /**
   * Register a hover prefetch on an element.
   * When the element is hovered for hoverDelayMs, the loader is called.
   *
   * @param {HTMLElement} element — Element to watch for hover
   * @param {string} key — Cache key
   * @param {Function} loader — Async function that returns data
   * @param {Object} [opts]
   * @param {AbortSignal} [opts.signal] — For cleanup
   */
  function onHover(element: HTMLElement, key: string, loader: () => Promise<unknown>, opts: Record<string, unknown> = {}) {
    if (!element || !isEnabled('prefetch')) return;

    const signal = opts.signal as AbortSignal | undefined;

    const mouseEnter = () => {
      _hoverTimer = setTimeout(() => {
        prefetch(key, loader);
      }, Number(hoverDelayMs));
    };

    const mouseLeave = () => {
      if (_hoverTimer) {
        clearTimeout(_hoverTimer);
        _hoverTimer = null;
      }
    };

    const listenerOpts = signal ? { signal } : {};
    element.addEventListener('mouseenter', mouseEnter, listenerOpts);
    element.addEventListener('mouseleave', mouseLeave, listenerOpts);
  }

  /**
   * Invalidate cached data.
   * @param {string} [key] — If omitted, clears all
   */
  function invalidate(key?: string) {
    if (key) {
      _cache.delete(key);
    } else {
      _cache.clear();
    }
  }

  /**
   * Get prefetch stats.
   * @returns {Object}
   */
  function getStats() {
    return {
      cacheSize: _cache.size,
      activePrefetches: _activePrefetches,
      totalPrefetches: _totalPrefetches,
      cacheHits: _cacheHits
    };
  }

  /**
   * Destroy the prefetch manager.
   */
  function destroy() {
    if (_hoverTimer) clearTimeout(_hoverTimer);
    _cache.clear();
  }

  return {
    prefetch, getCached, onHover,
    invalidate, getStats, destroy
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { Prefetch, injectPorts, info, healthCheck, VERSION, MODULE_ID };
