// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.3.0-MIGRATION-PHASE7)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.telemetry.event-metrics
// PURPOSE: Event Metrics — Rastreamento de métricas de eventos emitidos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   EventMetrics — Factory function
//   info(), healthCheck()
//
// @origin Adapted from panel-01 getEmitMetrics for nav-admin domain
// @changelog
//   10.3.0-MIGRATION-PHASE7: Initial creation — FASE 7 D.2
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.3.0-MIGRATION-PHASE7';
export const MODULE_ID = 'panel-nav-admin.telemetry.event-metrics';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[EventMetrics]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Factory: creates an EventMetrics tracker.
 * Records counts, rates, and timing of events.
 *
 * @param {Object} [options]
 * @param {number} [options.rateWindowMs=60000] — Window for rate calculation (ms)
 * @param {number} [options.maxHistory=500] — Max event history entries
 * @returns {Object} EventMetrics instance
 */
export function EventMetrics(options: Record<string, unknown> = {}) {
  const { rateWindowMs = 60000, maxHistory = 500 } = options;

  /** @private */
  const _counts: Record<string, number> = {};

  /** @private */
  const _history: { event: string; category: string; timestamp: number; meta: Record<string, unknown> }[] = [];

  /** @private */
  const _categoryTotals: Record<string, number> = {
    crud: 0,
    dragDrop: 0,
    filter: 0,
    view: 0,
    import: 0,
    export: 0,
    bulk: 0,
    other: 0
  };

  /** @private */
  const _startTime = Date.now();

  /**
   * Event category classification.
   * @private
   * @param {string} event
   * @returns {string}
   */
  function _categorize(event: string) {
    if (!event) return 'other';
    if (event.includes(':item:') || event.includes(':section:')) return 'crud';
    if (event.includes('drag') || event.includes('drop') || event.includes('reorder')) return 'dragDrop';
    if (event.includes('filter')) return 'filter';
    if (event.includes('view')) return 'view';
    if (event.includes('import')) return 'import';
    if (event.includes('export')) return 'export';
    if (event.includes('bulk')) return 'bulk';
    return 'other';
  }

  /**
   * Record an event occurrence.
   *
   * @param {string} eventName — Event identifier
   * @param {Object} [meta] — Additional metadata
   */
  function record(eventName: string, meta: Record<string, unknown> = {}) {
    const now = Date.now();

    // Count
    _counts[eventName] = (_counts[eventName] || 0) + 1;

    // Category
    const category = _categorize(eventName);
    _categoryTotals[category] = (_categoryTotals[category] || 0) + 1;

    // History
    _history.push({
      event: eventName,
      category,
      timestamp: now,
      meta
    });

    // Trim history
    if (_history.length > Number(maxHistory)) {
      _history.splice(0, _history.length - Number(maxHistory));
    }
  }

  /**
   * Get total count for an event.
   *
   * @param {string} eventName
   * @returns {number}
   */
  function getCount(eventName: string) {
    return _counts[eventName] || 0;
  }

  /**
   * Get all event counts.
   * @returns {Object<string, number>}
   */
  function getAllCounts() {
    return { ..._counts };
  }

  /**
   * Get category totals.
   * @returns {Object<string, number>}
   */
  function getCategoryTotals() {
    return { ..._categoryTotals };
  }

  /**
   * Get event rate (events per minute) for a specific event within the rate window.
   *
   * @param {string} [eventName] — If omitted, returns overall rate
   * @returns {number} Events per minute
   */
  function getRate(eventName?: string) {
    const now = Date.now();
    const cutoff = now - Number(rateWindowMs);
    const windowEvents = _history.filter(h => {
      if (h.timestamp < cutoff) return false;
      return eventName ? h.event === eventName : true;
    });

    const windowMinutes = Number(rateWindowMs) / 60000;
    return windowEvents.length / windowMinutes;
  }

  /**
   * Get top N events by count.
   *
   * @param {number} [n=10]
   * @returns {Array<{event: string, count: number}>}
   */
  function getTopEvents(n = 10) {
    return Object.entries(_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([event, count]) => ({ event, count }));
  }

  /**
   * Get full metrics summary.
   * @returns {Object}
   */
  function getSummary() {

    const totalEvents = Object.values(_counts).reduce((sum: number, c: number) => sum + c, 0);
    const uptimeMs = Date.now() - _startTime;

    return {
      totalEvents,
      uniqueEvents: Object.keys(_counts).length,
      categoryTotals: getCategoryTotals(),
      topEvents: getTopEvents(5),

      overallRate: getRate(),
      uptimeMs,
      historySize: _history.length
    };
  }

  /**
   * Get recent event history.
   *
   * @param {number} [limit=20]
   * @returns {Array<Object>}
   */
  function getRecentHistory(limit = 20) {
    return _history.slice(-limit);
  }

  /**
   * Reset all metrics.
   */
  function reset() {
    for (const key of Object.keys(_counts)) delete _counts[key];
    _history.length = 0;
    for (const key of Object.keys(_categoryTotals)) _categoryTotals[key] = 0;
    _log('info', 'Metrics reset');
  }

  return {
    record, getCount, getAllCounts, getCategoryTotals,
    getRate, getTopEvents, getSummary, getRecentHistory, reset
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { EventMetrics, injectPorts, info, healthCheck, VERSION, MODULE_ID };
