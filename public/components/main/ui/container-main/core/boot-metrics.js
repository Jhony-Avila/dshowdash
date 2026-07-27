import { createLogger } from "../utils/logger.js";
const VERSION = "1.0.0-PHASE4";
const MODULE_ID = "container-main:boot-metrics";
const BOOT_PHASES = Object.freeze({
  IDLE: "idle",
  EVENTBUS: "eventbus",
  PHASE1: "phase1",
  PHASE2: "phase2",
  PHASE3: "phase3",
  KERNEL: "kernel",
  MANAGERS: "managers",
  COMPONENTS: "components",
  PLUGINS: "plugins",
  COMPLETE: "complete"
});
const PERFORMANCE_THRESHOLDS = Object.freeze({
  EXCELLENT: 500,
  GOOD: 1e3,
  ACCEPTABLE: 2e3,
  SLOW: 3e3,
  CRITICAL: 5e3
});
function createBootMetrics(options = {}) {
  const { debug = false } = options;
  const _logger = createLogger(MODULE_ID);
  let _startTime = null;
  let _endTime = null;
  let _currentPhase = BOOT_PHASES.IDLE;
  let _phases = /* @__PURE__ */ new Map();
  let _milestones = [];
  let _errors = [];
  let _warnings = [];
  let _customMetrics = /* @__PURE__ */ new Map();
  function _startPhase(phase) {
    _currentPhase = phase;
    _phases.set(phase, {
      startTime: performance.now(),
      endTime: null,
      duration: null,
      status: "running",
      details: {}
    });
    if (debug) _logger.debug(`Phase started: ${phase}`, {});
  }
  function _endPhase(phase, status = "success", details = {}) {
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
      this.milestone("boot_start");
      if (debug) _logger.debug("Boot metrics started", {});
    },
    // Finaliza coleta
    end() {
      _endTime = performance.now();
      this.milestone("boot_end");
      if (debug) _logger.debug(`Boot metrics ended: ${this.getTotalTime().toFixed(2)}ms`, {});
    },
    // Marca início de fase
    startPhase(phase) {
      _startPhase(phase);
      this.milestone(`${phase}_start`);
    },
    // Marca fim de fase
    endPhase(phase, status = "success", details = {}) {
      _endPhase(phase, status, details);
      this.milestone(`${phase}_end`);
    },
    // Adiciona milestone
    milestone(name, data = {}) {
      _milestones.push({
        name,
        timestamp: performance.now(),
        elapsed: _startTime ? performance.now() - _startTime : 0,
        data
      });
    },
    // Registra erro
    recordError(phase, error) {
      _errors.push({
        phase,
        message: error.message || error,
        timestamp: performance.now(),
        elapsed: _startTime ? performance.now() - _startTime : 0
      });
    },
    // Registra warning
    recordWarning(phase, message) {
      _warnings.push({
        phase,
        message,
        timestamp: performance.now()
      });
    },
    // Registra métrica customizada
    record(name, value, unit = "ms") {
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
    getPhase(phase) {
      return _phases.get(phase) || null;
    },
    getPhases() {
      const result = {};
      for (const [name, data] of _phases) {
        result[name] = { ...data };
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
        result[name] = { ...data };
      }
      return result;
    },
    // Análise de performance
    getPerformanceRating() {
      const total = this.getTotalTime();
      if (total <= PERFORMANCE_THRESHOLDS.EXCELLENT) return "EXCELLENT";
      if (total <= PERFORMANCE_THRESHOLDS.GOOD) return "GOOD";
      if (total <= PERFORMANCE_THRESHOLDS.ACCEPTABLE) return "ACCEPTABLE";
      if (total <= PERFORMANCE_THRESHOLDS.SLOW) return "SLOW";
      return "CRITICAL";
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
      return _milestones.map((m, index) => ({
        ...m,
        index,
        delta: index > 0 ? m.elapsed - _milestones[index - 1].elapsed : 0
      }));
    },
    // Relatório completo
    getReport() {
      const total = this.getTotalTime();
      const phases = this.getPhases();
      const rating = this.getPerformanceRating();
      const bottlenecks = this.getBottlenecks();
      const breakdown = {};
      let accountedTime = 0;
      for (const [phase, data] of Object.entries(phases)) {
        if (data.duration) {
          breakdown[phase] = {
            duration: data.duration,
            percentage: `${(data.duration / total * 100).toFixed(1)}%`,
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
      console.group("\u{1F680} Boot Metrics Report");
      console.log(`Total: ${report.summary.totalTimeFormatted} (${report.summary.rating})`);
      console.log("Phases:", report.breakdown);
      if (report.bottlenecks.length > 0) {
        console.warn("\u26A0\uFE0F Bottlenecks:", report.bottlenecks);
      }
      if (report.errors.length > 0) {
        console.debug("%c[ERROR]%c \u274C Errors:", "color:#ef4444;font-weight:bold", "color:inherit", report.errors);
      }
      console.groupEnd();
    },
    // Health check
    healthCheck() {
      const rating = this.getPerformanceRating();
      let status = "HEALTHY";
      if (rating === "SLOW") status = "WARNING";
      if (rating === "CRITICAL") status = "DEGRADED";
      if (_errors.length > 0) status = "UNHEALTHY";
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
let _instance = null;
function getBootMetrics(options = {}) {
  if (!_instance) {
    _instance = createBootMetrics(options);
  }
  return _instance;
}
function resetBootMetrics() {
  if (_instance) {
    _instance.reset();
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, phases: Object.keys(BOOT_PHASES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var boot_metrics_default = {
  VERSION,
  MODULE_ID,
  BOOT_PHASES,
  PERFORMANCE_THRESHOLDS,
  createBootMetrics,
  getBootMetrics,
  resetBootMetrics,
  info,
  healthCheck
};
export {
  BOOT_PHASES,
  MODULE_ID,
  PERFORMANCE_THRESHOLDS,
  VERSION,
  createBootMetrics,
  boot_metrics_default as default,
  getBootMetrics,
  healthCheck,
  info,
  resetBootMetrics
};
