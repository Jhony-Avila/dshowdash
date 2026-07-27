// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.3.0-MIGRATION-PHASE7)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.telemetry.percentile-metrics
// PURPOSE: Percentile Metrics — Cálculo de p50/p95/p99 para operações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   PercentileMetrics — Factory function
//   calculatePercentile() — Standalone percentile calculation
//   info(), healthCheck()
//
// @origin Adapted from panel-01 percentile metrics for nav-admin domain
// @changelog
//   10.3.0-MIGRATION-PHASE7: Initial creation — FASE 7 I.1
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.3.0-MIGRATION-PHASE7';
export const MODULE_ID = 'panel-nav-admin.telemetry.percentile-metrics';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

/**
 * Calculate a percentile from a sorted array of numbers.
 *
 * @param {Array<number>} sorted — Sorted array of values
 * @param {number} p — Percentile (0-100)
 * @returns {number}
 */
export function calculatePercentile(sorted: number[], p: number) {
  if (!sorted || sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}

/**
 * Factory: creates a PercentileMetrics tracker.
 * Records timing samples for named operations and computes percentiles.
 *
 * @param {Object} [options]
 * @param {number} [options.maxSamples=1000] — Max samples per metric
 * @param {Array<number>} [options.percentiles=[50, 95, 99]] — Percentiles to calculate
 * @returns {Object} PercentileMetrics instance
 */
export function PercentileMetrics(options: Record<string, unknown> = {}) {
  const {
    maxSamples = 1000,
    percentiles = [50, 95, 99]
  } = options;

  /** @private Map<string, Array<number>> */
  const _samples = new Map();

  /** @private Active timers */
  const _timers = new Map();

  /**
   * Record a timing sample for a named metric.
   *
   * @param {string} metricName — Metric identifier (e.g. 'crud.save', 'render.table')
   * @param {number} durationMs — Duration in milliseconds
   */
  function record(metricName: string, durationMs: number) {
    if (!_samples.has(metricName)) {
      _samples.set(metricName, []);
    }

    const samples = _samples.get(metricName);
    samples.push(durationMs);

    // Trim if exceeded
    if (samples.length > Number(maxSamples)) {
      samples.splice(0, samples.length - Number(maxSamples));
    }
  }

  /**
   * Start a timer for a named metric.
   * Returns a stop function that records the duration.
   *
   * @param {string} metricName
   * @returns {Function} stop() — Call to stop timer and record sample
   */
  function startTimer(metricName: string) {
    const start = performance.now();
    const timerId = `${metricName}_${start}`;
    _timers.set(timerId, { metricName, start });

    return () => {
      const duration = performance.now() - start;
      _timers.delete(timerId);
      record(metricName, duration);
      return duration;
    };
  }

  /**
   * Get percentile values for a named metric.
   *
   * @param {string} metricName
   * @returns {Object} e.g. { p50: 12, p95: 45, p99: 120, count: 500, min: 2, max: 200, avg: 18 }
   */
  function getPercentiles(metricName: string) {
    const samples = _samples.get(metricName) as number[] | undefined;
    if (!samples || samples.length === 0) {
      const result: Record<string, number> = { count: 0, min: 0, max: 0, avg: 0 };
      for (const p of percentiles as number[]) result[`p${p}`] = 0;
      return result;
    }

    const sorted = [...samples].sort((a: number, b: number) => a - b);
    const sum = sorted.reduce((s: number, v: number) => s + v, 0);

    const result: Record<string, number> = {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round((sum / sorted.length) * 100) / 100
    };

    for (const p of percentiles as number[]) {
      result[`p${p}`] = Math.round(calculatePercentile(sorted, p) * 100) / 100;
    }

    return result;
  }

  /**
   * Get percentiles for all recorded metrics.
   *
   * @returns {Object<string, Object>}
   */
  function getAllPercentiles() {
    const result: Record<string, Record<string, number>> = {};
    for (const metricName of _samples.keys()) {
      result[metricName] = getPercentiles(metricName);
    }
    return result;
  }

  /**
   * Get list of recorded metric names.
   * @returns {Array<string>}
   */
  function getMetricNames() {
    return [..._samples.keys()];
  }

  /**
   * Get full summary report.
   * @returns {Object}
   */
  function getSummary() {
    const all = getAllPercentiles();
    const totalSamples = [..._samples.values()].reduce((sum, s) => sum + s.length, 0);

    return {
      metrics: all,
      totalMetrics: _samples.size,
      totalSamples,
      activeTimers: _timers.size,
      percentileConfig: percentiles
    };
  }

  /**
   * Reset all samples.
   * @param {string} [metricName] — If provided, reset only this metric
   */
  function reset(metricName?: string) {
    if (metricName) {
      _samples.delete(metricName);
    } else {
      _samples.clear();
      _timers.clear();
    }
  }

  return {
    record, startTimer,
    getPercentiles, getAllPercentiles,
    getMetricNames, getSummary, reset
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  // Self-test
  const testData = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const p50 = calculatePercentile(testData, 50);
  const selfTestPassed = Math.abs(p50 - 55) < 0.01;

  return {
    status: selfTestPassed ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    selfTestPassed
  };
}

export default { PercentileMetrics, calculatePercentile, injectPorts, info, healthCheck, VERSION, MODULE_ID };
