
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE4-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:boot-metrics
// PURPOSE: Boot Metrics - Serviço de métricas de inicialização
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BOOT_PHASES — exported value
//   PERFORMANCE_THRESHOLDS — exported value
//   createBootMetrics() — exported function
//   getBootMetrics() — exported function
//   resetBootMetrics() — exported function
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

import { createLogger } from '../utils/logger.js';

export const VERSION = '1.0.0-PHASE4';
export const MODULE_ID = 'container-main:boot-metrics';

// Fases do boot
export const BOOT_PHASES = Object.freeze({
  IDLE: 'idle',
  EVENTBUS: 'eventbus',
  PHASE1: 'phase1',
  PHASE2: 'phase2',
  PHASE3: 'phase3',
  KERNEL: 'kernel',
  MANAGERS: 'managers',
  COMPONENTS: 'components',
  PLUGINS: 'plugins',
  COMPLETE: 'complete'
});

// Thresholds de performance
export const PERFORMANCE_THRESHOLDS = Object.freeze({
  EXCELLENT: 500,
  GOOD: 1000,
  ACCEPTABLE: 2000,
  SLOW: 3000,
  CRITICAL: 5000
});

// Cria o serviço de métricas
export function createBootMetrics(options: Record<string, unknown> = {}) {
  const { debug = false } = options;

  const _logger = createLogger(MODULE_ID);
  let _startTime: number | null = null;
  let _endTime: number | null = null;
  let _currentPhase: string = BOOT_PHASES.IDLE;
  let _phases = new Map();
  let _milestones: unknown[] = [];
  let _errors: unknown[] = [];
  let _warnings: unknown[] = [];
  let _customMetrics = new Map();

  // Marca início de fase
  function _startPhase(phase: string) {
    _currentPhase = phase;
    _phases.set(phase, {
      startTime: performance.now(),
      endTime: null,
      duration: null,
      status: 'running',
      details: {}
    });
    
    if (debug) _logger.debug(`Phase started: ${phase}`, {});
  }

  // Marca fim de fase
  function _endPhase(phase: string, status = 'success', details = {}) {
    const phaseData = _phases.get(phase);
    if (phaseData) {
      phaseData.endTime = performance.now();
      phaseData.duration = phaseData.endTime - phaseData.startTime;
      phaseData.status = status;
      phaseData.details = details;
      
      if (debug) _logger.debug(`Phase ended: ${phase} (${phaseData.duration.toFixed(2)}ms)`, {});
    }
  }

  const metrics = {
    // Inicia coleta de métricas
    start() {
      _startTime = performance.now();
      _phases.clear();
      _milestones = [];
      _errors = [];
      _warnings = [];
      _customMetrics.clear();
      _currentPhase = BOOT_PHASES.IDLE;
      
      this.milestone('boot_start');
      if (debug) _logger.debug('Boot metrics started', {});
    },

    // Finaliza coleta
    end() {
      _endTime = performance.now();
      this.milestone('boot_end');
      
      if (debug) _logger.debug(`Boot metrics ended: ${this.getTotalTime().toFixed(2)}ms`, {});
    },

    // Marca início de fase
    startPhase(phase: string) {
      _startPhase(phase);
      this.milestone(`${phase}_start`);
    },

    // Marca fim de fase
    endPhase(phase: string, status = 'success', details = {}) {
      _endPhase(phase, status, details);
      this.milestone(`${phase}_end`);
    },

    // Adiciona milestone
    milestone(name: string, data = {}) {
      _milestones.push({
        name,
        timestamp: performance.now(),
        elapsed: _startTime ? performance.now() - _startTime : 0,
        data
      });
    },

    // Registra erro
    recordError(phase: string, error: Record<string, unknown>) {
      _errors.push({
        phase,
        message: error.message || error,
        timestamp: performance.now(),
        elapsed: _startTime ? performance.now() - _startTime : 0
      });
    },

    // Registra warning
    recordWarning(phase: string, message: string) {
      _warnings.push({
        phase,
        message,
        timestamp: performance.now()
      });
    },

    // Registra métrica customizada
    record(name: string, value: unknown, unit = 'ms') {
      _customMetrics.set(name, { value, unit, timestamp: performance.now() });
    },

    // Getters
    getTotalTime() {
      if (!_startTime) return 0;
      return (_endTime || performance.now()) - _startTime;
    },

    getCurrentPhase() {
      return _currentPhase;
    },

    getPhase(phase: string) {
      return _phases.get(phase) || null;
    },

    getPhases() {
      const result = {};
      for (const [name, data] of _phases) {
        (result as Record<string, unknown>)[name] = { ...data };
      }
      return result;
    },

    getMilestones() {
      return [..._milestones];
    },

    getErrors() {
      return [..._errors];
    },

    getWarnings() {
      return [..._warnings];
    },

    getCustomMetrics() {
      const result = {};
      for (const [name, data] of _customMetrics) {
        (result as Record<string, unknown>)[name] = { ...data };
      }
      return result;
    },

    // Análise de performance
    getPerformanceRating() {
      const total = this.getTotalTime();
      
      if (total <= PERFORMANCE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
      if (total <= PERFORMANCE_THRESHOLDS.GOOD) return 'GOOD';
      if (total <= PERFORMANCE_THRESHOLDS.ACCEPTABLE) return 'ACCEPTABLE';
      if (total <= PERFORMANCE_THRESHOLDS.SLOW) return 'SLOW';
      return 'CRITICAL';
    },

    // Identifica gargalos
    getBottlenecks(threshold = 500) {
      const bottlenecks = [];
      
      for (const [phase, data] of _phases) {
        if (data.duration && data.duration > threshold) {
          bottlenecks.push({
            phase,
            duration: data.duration,
            exceeds: data.duration - threshold
          });
        }
      }
      
      return bottlenecks.sort((a, b) => b.duration - a.duration);
    },

    // Timeline detalhado
    getTimeline() {
      // @ts-expect-error strict migration — TS2345
      return _milestones.map((m: Record<string, unknown>, index: number) => ({
        ...(m as Record<string, unknown>),
        index,
        delta: index > 0 ? (m.elapsed as number) - ((_milestones[index - 1] as Record<string, unknown>).elapsed as number) : 0
      }));
    },

    // Relatório completo
    getReport() {
      const total = this.getTotalTime();
      const phases = this.getPhases();
      const rating = this.getPerformanceRating();
      const bottlenecks = this.getBottlenecks();
      
      // Calcula breakdown por fase
      const breakdown = {};
      let accountedTime = 0;
      
      for (const [phase, data] of Object.entries(phases) as any) {
        if (data.duration) {
          (breakdown as Record<string, unknown>)[phase] = {
            duration: data.duration,
            percentage: `${((data.duration / total) * 100).toFixed(1)}%`,
            status: data.status
          };
          accountedTime += data.duration;
        }
      }

      return {
        summary: {
          totalTime: total,
          totalTimeFormatted: `${total.toFixed(2)}ms`,
          rating,
          phases: Object.keys(phases).length,
          milestones: _milestones.length,
          errors: _errors.length,
          warnings: _warnings.length
        },
        breakdown,
        bottlenecks,
        timeline: this.getTimeline(),
        errors: this.getErrors(),
        warnings: this.getWarnings(),
        customMetrics: this.getCustomMetrics(),
        thresholds: PERFORMANCE_THRESHOLDS
      };
    },

    // Exporta para console
    logReport() {
      const report = this.getReport();
      
      console.group('🚀 Boot Metrics Report');
      console.log(`Total: ${report.summary.totalTimeFormatted} (${report.summary.rating})`);
      console.log('Phases:', report.breakdown);
      
      if (report.bottlenecks.length > 0) {
        console.warn('⚠️ Bottlenecks:', report.bottlenecks);
      }
      
      if (report.errors.length > 0) {
        console.debug('%c[ERROR]%c ❌ Errors:', 'color:#ef4444;font-weight:bold', 'color:inherit', report.errors);
      }
      
      console.groupEnd();
    },

    // Health check
    healthCheck() {
      const rating = this.getPerformanceRating();
      let status = 'HEALTHY';
      
      if (rating === 'SLOW') status = 'WARNING';
      if (rating === 'CRITICAL') status = 'DEGRADED';
      if (_errors.length > 0) status = 'UNHEALTHY';

      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        totalTime: this.getTotalTime(),
        rating,
        errorsCount: _errors.length,
        warningsCount: _warnings.length
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        phases: Object.keys(BOOT_PHASES),
        thresholds: PERFORMANCE_THRESHOLDS,
        currentPhase: _currentPhase,
        collecting: _startTime !== null && _endTime === null
      };
    },

    // Reset
    reset() {
      _startTime = null;
      _endTime = null;
      _currentPhase = BOOT_PHASES.IDLE;
      _phases.clear();
      _milestones = [];
      _errors = [];
      _warnings = [];
      _customMetrics.clear();
    }
  };

  return metrics;
}

// Singleton
interface BootMetricsInstance {
  reset: () => void;
  healthCheck: () => Record<string, unknown>;
  [key: string]: unknown;
}

let _instance: BootMetricsInstance | null = null;

export function getBootMetrics(options = {}) {
  if (!_instance) {
    _instance = createBootMetrics(options) as BootMetricsInstance;
  }
  return _instance;
}

export function resetBootMetrics() {
  if (_instance) {
    _instance.reset();
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, phases: Object.keys(BOOT_PHASES) };
}

export function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  BOOT_PHASES, PERFORMANCE_THRESHOLDS,
  createBootMetrics, getBootMetrics, resetBootMetrics,
  info, healthCheck
};
