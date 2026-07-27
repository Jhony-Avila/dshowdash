// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.4.0-MIGRATION-PHASE8)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.performance.monitor
// PURPOSE: Performance Monitor — Timer, interaction count, metrics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   PerformanceMonitor — Factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01 performance monitor for nav-admin domain
// @changelog
//   10.4.0-MIGRATION-PHASE8: Initial creation — FASE 8 H.1
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.4.0-MIGRATION-PHASE8';
export const MODULE_ID = 'panel-nav-admin.performance.monitor';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[PerfMonitor]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Factory: creates a PerformanceMonitor.
 * Tracks mount time, CRUD timing, render timing, interaction counts.
 *
 * @param {Object} [options]
 * @param {number} [options.slowThresholdMs=500] — Threshold for marking operation as slow
 * @param {boolean} [options.autoReport=false] — Auto-log report every reportIntervalMs
 * @param {number} [options.reportIntervalMs=60000] — Auto-report interval
 * @returns {Object} PerformanceMonitor instance
 */
export function PerformanceMonitor(options: Record<string, unknown> = {}) {
  const {
    slowThresholdMs = 500,
    autoReport = false,
    reportIntervalMs = 60000
  } = options;

  /** @private */
  const _marks = new Map();

  /** @private */
  const _timings = {};

  /** @private */
  const _interactions = {
    clicks: 0,
    keystrokes: 0,
    dragDrops: 0,
    formSubmits: 0,
    searches: 0,
    total: 0
  };

  /** @private */
  const _slow: { name: string; duration: number; timestamp: number }[] = [];

  /** @private */
  let _mountStart: number | null = null;
  let _mountEnd: number | null = null;
  let _reportTimer: ReturnType<typeof setInterval> | null = null;

  if (autoReport) {
    _reportTimer = setInterval(() => {
      _log('info', 'Auto-report:', getReport());
    }, Number(reportIntervalMs));
  }

  /**
   * Mark the start of panel mounting.
   */
  function markMountStart() {
    _mountStart = performance.now();
  }

  /**
   * Mark the end of panel mounting.
   * @returns {number} Mount duration in ms
   */
  function markMountEnd() {
    _mountEnd = performance.now();
    const duration = _mountStart ? _mountEnd - _mountStart : 0;
    _record('mount', duration);
    return duration;
  }

  /**
   * Start a named performance mark (timing).
   *
   * @param {string} name — Operation name (e.g. 'crud.save', 'render.table')
   * @returns {Function} stop() — Call to stop and record
   */
  function mark(name: string) {
    const start = performance.now();
    _marks.set(name, start);

    return () => {
      const duration = performance.now() - start;
      _marks.delete(name);
      _record(name, duration);

      if (duration > Number(slowThresholdMs)) {
        _slow.push({ name, duration, timestamp: Date.now() });
        _log('debug', `Slow operation: ${name} took ${duration.toFixed(1)}ms`);
      }

      return duration;
    };
  }

  /**
   * Record a pre-measured timing.
   * @private
   * @param {string} name
   * @param {number} duration
   */
  function _record(name: string, duration: number) {
    const timings = _timings as Record<string, { count: number; total: number; min: number; max: number; last: number }>;
    if (!timings[name]) {
      timings[name] = { count: 0, total: 0, min: Infinity, max: 0, last: 0 };
    }
    const t = timings[name];
    t.count++;
    t.total += duration;
    t.last = duration;
    if (duration < t.min) t.min = duration;
    if (duration > t.max) t.max = duration;
  }

  /**
   * Record an interaction.
   * @param {string} type — 'click' | 'keystroke' | 'dragDrop' | 'formSubmit' | 'search'
   */
  function recordInteraction(type: string) {
    _interactions.total++;
    switch (type) {
      case 'click': _interactions.clicks++; break;
      case 'keystroke': _interactions.keystrokes++; break;
      case 'dragDrop': _interactions.dragDrops++; break;
      case 'formSubmit': _interactions.formSubmits++; break;
      case 'search': _interactions.searches++; break;
    }
  }

  /**
   * Get timing stats for a named operation.
   *
   * @param {string} name
   * @returns {Object|null}
   */
  function getTiming(name: string) {
    const t = (_timings as Record<string, { count: number; total: number; min: number; max: number; last: number }>)[name];
    if (!t) return null;
    return {
      ...t,
      avg: t.count > 0 ? Math.round((t.total / t.count) * 100) / 100 : 0
    };
  }

  /**
   * Get all timings.
   * @returns {Object}
   */
  function getAllTimings() {
    const result: Record<string, unknown> = {};
    for (const [name, t] of Object.entries(_timings as Record<string, { count: number; total: number; min: number; max: number; last: number }>)) {
      result[name] = {
        ...t,
        avg: t.count > 0 ? Math.round((t.total / t.count) * 100) / 100 : 0
      };
    }
    return result;
  }

  /**
   * Get interactions summary.
   * @returns {Object}
   */
  function getInteractions() {
    return { ..._interactions };
  }

  /**
   * Get slow operations log.
   * @returns {Array<Object>}
   */
  function getSlowOperations() {
    return [..._slow];
  }

  /**
   * Get full performance report.
   * @returns {Object}
   */
  function getReport() {
    return {
      mountDuration: _mountStart && _mountEnd ? Math.round(_mountEnd - _mountStart) : null,
      timings: getAllTimings(),
      interactions: getInteractions(),
      slowOperations: _slow.length,
      activeMeasurements: _marks.size
    };
  }

  /**
   * Reset all metrics.
   */
  function reset() {
    _marks.clear();
    for (const key of Object.keys(_timings)) delete (_timings as Record<string, unknown>)[key];
    for (const key of Object.keys(_interactions)) (_interactions as Record<string, number>)[key] = 0;
    _slow.length = 0;
    _mountStart = null;
    _mountEnd = null;
  }

  /**
   * Destroy the monitor (clear auto-report timer).
   */
  function destroy() {
    if (_reportTimer) {
      clearInterval(_reportTimer);
      _reportTimer = null;
    }
    reset();
  }

  return {
    markMountStart, markMountEnd, mark,
    recordInteraction, getTiming, getAllTimings,
    getInteractions, getSlowOperations, getReport,
    reset, destroy
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { PerformanceMonitor, injectPorts, info, healthCheck, VERSION, MODULE_ID };
