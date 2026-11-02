// Phase Metrics Manager
// @version 3.1.1-CONTRACTS
// @changelog v3.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v3.1.0-MODULAR: Modularização
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory options):
//   options.metricsSummary — boot-metrics-summary instance
//   options.healthAggregator — health-aggregator instance
// PROVIDES: createPhaseMetrics() factory returning:
//   recordPhase(), recordError(), recordWarning(),
//   incrementRecoveries(), incrementCircuitBreakerTrips(),
//   getPhaseMemory(), getMemoryMetrics(), getMetrics(), reset()
// BROWSER APIs:
//   performance.now() — LEGÍTIMO: timing measurement
//   performance.memory — LEGÍTIMO: heap metrics (Chrome only)
// WINDOW ACCESS: performance.now(), performance.memory
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.metrics.phase-metrics';

interface PhaseMetricsOptions {
  metricsSummary?: Record<string, Function> | null;
  healthAggregator?: Record<string, Function> | null;
}

interface MemoryMetric {
  start: number;
  end: number;
  delta: number;
  duration: number;
}

interface PhaseResult {
  initialized?: unknown[];
  failed?: unknown[];
  [key: string]: unknown;
}

export function createPhaseMetrics(options: PhaseMetricsOptions) {
  const metricsSummary = options.metricsSummary;
  const healthAggregator = options.healthAggregator;

  const metrics: {
    phaseTimings: Record<string, number>;
    phasesExecuted: number;
    phasesSucceeded: number;
    phasesFailed: number;
    phasesSkipped: number;
    recoveries: number;
    circuitBreakerTrips: number;
    memoryMetrics: Record<string, MemoryMetric>;
  } = {
    phaseTimings: {},
    phasesExecuted: 0,
    phasesSucceeded: 0,
    phasesFailed: 0,
    phasesSkipped: 0,
    recoveries: 0,
    circuitBreakerTrips: 0,
    memoryMetrics: {}
  };

  return {
    recordPhase: function(phaseId: string, phaseStart: number, status: string, result: PhaseResult | null, critical: boolean, memoryStart: { usedJSHeapSize: number } | null, memoryEnd: { usedJSHeapSize: number } | null) {
      const phaseTime = Math.round(performance.now() - phaseStart);
      metrics.phaseTimings[phaseId] = phaseTime;
      metrics.phasesExecuted++;

      if (status === 'success') {
        metrics.phasesSucceeded++;
      } else if (status === 'skipped') {
        metrics.phasesSkipped++;
      } else {
        metrics.phasesFailed++;
      }

      // Memory metrics
      if (memoryStart && memoryEnd) {
        metrics.memoryMetrics[phaseId] = {
          start: memoryStart.usedJSHeapSize,
          end: memoryEnd.usedJSHeapSize,
          delta: memoryEnd.usedJSHeapSize - memoryStart.usedJSHeapSize,
          duration: phaseTime
        };

        if (healthAggregator && healthAggregator.capturePhaseMemory) {
          healthAggregator.capturePhaseMemory(phaseId, 'start');
          healthAggregator.capturePhaseMemory(phaseId, 'end');
        }
      }

      // MetricsSummary integration
      if (metricsSummary && metricsSummary.recordPhase) {
        metricsSummary.recordPhase(phaseId, {
          startTime: phaseStart,
          endTime: performance.now(),
          duration: phaseTime,
          status: status,
          modulesLoaded: result && result.initialized ? result.initialized.length : 0,
          modulesFailed: result && result.failed ? result.failed.length : 0,
          critical: critical,
          memory: metrics.memoryMetrics[phaseId] || null
        });
      }

      if (metricsSummary && metricsSummary.updateMemoryPeak) {
        metricsSummary.updateMemoryPeak();
      }

      return phaseTime;
    },

    recordError: function(error: Error, context: Record<string, unknown>) {
      if (metricsSummary && metricsSummary.recordError) {
        metricsSummary.recordError(error, context);
      }
    },

    recordWarning: function(message: string, context: Record<string, unknown>) {
      if (metricsSummary && metricsSummary.recordWarning) {
        metricsSummary.recordWarning(message, context);
      }
    },

    incrementRecoveries: function() {
      metrics.recoveries++;
    },

    incrementCircuitBreakerTrips: function() {
      metrics.circuitBreakerTrips++;
    },

    getPhaseMemory: function(phaseId: string) {
      return metrics.memoryMetrics[phaseId] || null;
    },

    getMemoryMetrics: function() {
      return Object.assign({}, metrics.memoryMetrics);
    },

    getMetrics: function() {
      return Object.assign({}, metrics);
    },

    reset: function() {
      metrics.phaseTimings = {};
      metrics.phasesExecuted = 0;
      metrics.phasesSucceeded = 0;
      metrics.phasesFailed = 0;
      metrics.phasesSkipped = 0;
      metrics.recoveries = 0;
      metrics.circuitBreakerTrips = 0;
      metrics.memoryMetrics = {};
    }
  };
}

export default { createPhaseMetrics };
