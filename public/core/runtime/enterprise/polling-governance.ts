// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0-POLLING-GOVERNANCE)
// ═══════════════════════════════════════════════════════════════
// MODULE: enterprise/polling-governance
// PURPOSE: Centralized polling governance — visibility gating,
//          lifecycle enforcement, metrics, and violation tracking.
//          Provides a governed polling factory that auto-pauses
//          when tab is hidden and records violations for ungoverned
//          polling patterns.
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   recordViolation from ./strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createGovernedPolling(moduleId, config) — governed polling factory
//   getRegistry() — all active polling instances
//   getMetrics() — global polling metrics
//   resetMetrics() — reset global metrics
//   destroyAll() — destroy all registered polling instances
//   info() — module metadata
//   healthCheck() — module health
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none — uses recordViolation pipeline)
// LISTENS (eventos):
//   visibilitychange — document visibility for auto-pause
// WINDOW ACCESS:
//   document.hidden — visibility state
//   document.addEventListener('visibilitychange') — auto-pause
// ═══════════════════════════════════════════════════════════════
'use strict';

import { recordViolation } from './strict-mode.js';

export const VERSION: string = '1.0.0-POLLING-GOVERNANCE';
export const MODULE_ID: string = 'enterprise/polling-governance';

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface PollingConfig {
  interval?: number;
  visibilityGating?: boolean;
  immediate?: boolean;
  maxErrors?: number;
  backoffMultiplier?: number;
  maxBackoffInterval?: number;
}

interface ResolvedPollingConfig {
  interval: number;
  visibilityGating: boolean;
  immediate: boolean;
  maxErrors: number;
  backoffMultiplier: number;
  maxBackoffInterval: number;
}

interface PollingInstanceMetrics {
  starts: number;
  stops: number;
  ticks: number;
  errors: number;
  consecutiveErrors: number;
  lastTickAt: number | null;
  lastErrorAt: number | null;
  startedAt: number | null;
  backoffActive: boolean;
}

interface PollingInstanceMetricsExtended extends PollingInstanceMetrics {
  moduleId: string;
  instanceId: string;
  currentInterval: number;
  isRunning: boolean;
  isPausedByUser: boolean;
  isPausedByVisibility: boolean;
  isDestroyed: boolean;
}

interface PollingInstanceHealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: number;
  maxScore: number;
  scoreDisplay: string;
  checks: Record<string, boolean>;
  moduleId: string;
  instanceId: string;
  version: string;
}

interface PollingInstanceInfo {
  version: string;
  moduleId: string;
  instanceId: string;
  config: ResolvedPollingConfig;
  metrics: PollingInstanceMetricsExtended;
  healthCheck: PollingInstanceHealthCheck;
}

interface GovernedPollingInstance {
  _config: ResolvedPollingConfig;
  _isRunning: boolean;
  _isPausedByVisibility: boolean;
  start: (callback?: () => void | Promise<void>) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  _pauseForVisibility: () => void;
  _resumeFromVisibility: () => void;
  forceRun: () => void;
  setInterval: (ms: number) => void;
  destroy: () => void;
  isRunning: () => boolean;
  isPaused: () => boolean;
  isDestroyed: () => boolean;
  getMetrics: () => PollingInstanceMetricsExtended;
  healthCheck: () => PollingInstanceHealthCheck;
  info: () => PollingInstanceInfo;
}

interface GlobalPollingMetrics {
  totalCreated: number;
  totalDestroyed: number;
  totalPaused: number;
  totalResumed: number;
  totalTicks: number;
  totalErrors: number;
  visibilityPauses: number;
  visibilityResumes: number;
}

interface ActiveCount {
  total: number;
  running: number;
  paused: number;
}

interface GlobalPollingHealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: number;
  maxScore: number;
  scoreDisplay: string;
  checks: Record<string, boolean>;
  activeInstances: ActiveCount;
  metrics: GlobalPollingMetrics & { activeInstances: number };
  version: string;
  moduleId: string;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL REGISTRY — tracks all governed polling instances
// ═══════════════════════════════════════════════════════════════
const _registry: Map<string, GovernedPollingInstance> = new Map();
let _visibilityBound: boolean = false;

const _globalMetrics: GlobalPollingMetrics = {
  totalCreated: 0,
  totalDestroyed: 0,
  totalPaused: 0,
  totalResumed: 0,
  totalTicks: 0,
  totalErrors: 0,
  visibilityPauses: 0,
  visibilityResumes: 0
};

// ═══════════════════════════════════════════════════════════════
// VISIBILITY GATING — auto-pause all when tab is hidden
// ═══════════════════════════════════════════════════════════════
function _ensureVisibilityBinding(): void {
  if (_visibilityBound || typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', _onVisibilityChange);
  _visibilityBound = true;
}

function _onVisibilityChange(): void {
  const hidden: boolean = document.hidden;
  _registry.forEach((instance: GovernedPollingInstance) => {
    if (!instance._config.visibilityGating) return;
    if (hidden && instance._isRunning && !instance._isPausedByVisibility) {
      instance._pauseForVisibility();
      _globalMetrics.visibilityPauses++;
    } else if (!hidden && instance._isPausedByVisibility) {
      instance._resumeFromVisibility();
      _globalMetrics.visibilityResumes++;
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// GOVERNED POLLING FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a governed polling instance with visibility gating,
 * lifecycle enforcement, and violation tracking.
 */
export function createGovernedPolling(moduleId: string, config: PollingConfig = {}): GovernedPollingInstance {
  _ensureVisibilityBinding();

  const instanceId: string = `${moduleId}-${Date.now()}`;
  const _config: ResolvedPollingConfig = {
    interval: config.interval || 30000,
    visibilityGating: config.visibilityGating !== false,
    immediate: config.immediate !== false,
    maxErrors: config.maxErrors || 10,
    backoffMultiplier: config.backoffMultiplier || 1.5,
    maxBackoffInterval: config.maxBackoffInterval || 120000
  };

  let _timerId: ReturnType<typeof setInterval> | null = null;
  let _isRunning: boolean = false;
  let _isPausedByUser: boolean = false;
  let _isPausedByVisibility: boolean = false;
  let _isDestroyed: boolean = false;
  let _callback: (() => void | Promise<void>) | null = null;
  let _currentInterval: number = _config.interval;
  let _consecutiveErrors: number = 0;

  const _metrics: PollingInstanceMetrics = {
    starts: 0,
    stops: 0,
    ticks: 0,
    errors: 0,
    consecutiveErrors: 0,
    lastTickAt: null,
    lastErrorAt: null,
    startedAt: null,
    backoffActive: false
  };

  function _clearTimer(): void {
    if (_timerId !== null) {
      clearInterval(_timerId);
      _timerId = null;
    }
  }

  async function _tick(): Promise<void> {
    if (_isDestroyed || !_callback) return;
    _globalMetrics.totalTicks++;
    _metrics.ticks++;
    _metrics.lastTickAt = Date.now();
    try {
      await _callback();
      _consecutiveErrors = 0;
      _metrics.consecutiveErrors = 0;
      if (_metrics.backoffActive) {
        _currentInterval = _config.interval;
        _metrics.backoffActive = false;
        _restartTimer();
      }
    } catch (error: unknown) {
      _consecutiveErrors++;
      _metrics.errors++;
      _metrics.consecutiveErrors = _consecutiveErrors;
      _metrics.lastErrorAt = Date.now();
      _globalMetrics.totalErrors++;
      if (_consecutiveErrors >= _config.maxErrors) {
        _stop();
        recordViolation('FETCH_WITHOUT_SIGNAL', {
          module: moduleId,
          reason: `Polling auto-stopped after ${_consecutiveErrors} consecutive errors`,
          recommendation: 'Check endpoint availability and error handling'
        });
      } else if (_config.backoffMultiplier > 1) {
        _currentInterval = Math.min(
          _currentInterval * _config.backoffMultiplier,
          _config.maxBackoffInterval
        );
        _metrics.backoffActive = true;
        _restartTimer();
      }
    }
  }

  function _restartTimer(): void {
    _clearTimer();
    if (_isRunning && !_isPausedByUser && !_isPausedByVisibility) {
      _timerId = setInterval(_tick, _currentInterval);
    }
  }

  function _stop(): void {
    _clearTimer();
    _isRunning = false;
    _metrics.stops++;
  }

  const instance: GovernedPollingInstance = {
    _config,
    _isRunning: false,
    _isPausedByVisibility: false,

    start(callback?: () => void | Promise<void>): void {
      if (_isDestroyed) return;
      if (_isRunning) return;
      if (callback) _callback = callback;
      if (!_callback) {
        recordViolation('LIFECYCLE_DESTROY_MISSING', {
          module: moduleId,
          reason: 'Polling started without callback'
        });
        return;
      }

      _isRunning = true;
      instance._isRunning = true;
      _isPausedByUser = false;
      _currentInterval = _config.interval;
      _consecutiveErrors = 0;
      _metrics.starts++;
      _metrics.startedAt = Date.now();
      _globalMetrics.totalCreated++;

      if (_config.immediate) _tick();
      _timerId = setInterval(_tick, _currentInterval);
    },

    stop(): void {
      if (!_isRunning) return;
      _stop();
      instance._isRunning = false;
    },

    pause(): void {
      if (!_isRunning || _isPausedByUser) return;
      _isPausedByUser = true;
      _clearTimer();
      _globalMetrics.totalPaused++;
    },

    resume(): void {
      if (!_isRunning || !_isPausedByUser) return;
      _isPausedByUser = false;
      _globalMetrics.totalResumed++;
      if (!_isPausedByVisibility) {
        _timerId = setInterval(_tick, _currentInterval);
        if (_config.immediate) _tick();
      }
    },

    _pauseForVisibility(): void {
      _isPausedByVisibility = true;
      instance._isPausedByVisibility = true;
      _clearTimer();
    },

    _resumeFromVisibility(): void {
      _isPausedByVisibility = false;
      instance._isPausedByVisibility = false;
      if (_isRunning && !_isPausedByUser) {
        _timerId = setInterval(_tick, _currentInterval);
      }
    },

    forceRun(): void {
      if (_isDestroyed) return;
      _tick();
    },

    setInterval(ms: number): void {
      _config.interval = ms;
      _currentInterval = ms;
      if (_isRunning) _restartTimer();
    },

    destroy(): void {
      if (_isDestroyed) return;
      _stop();
      instance._isRunning = false;
      _isDestroyed = true;
      _callback = null;
      _registry.delete(instanceId);
      _globalMetrics.totalDestroyed++;
    },

    isRunning(): boolean { return _isRunning && !_isPausedByUser && !_isPausedByVisibility; },
    isPaused(): boolean { return _isPausedByUser || _isPausedByVisibility; },
    isDestroyed(): boolean { return _isDestroyed; },

    getMetrics(): PollingInstanceMetricsExtended {
      return Object.assign({}, _metrics, {
        moduleId,
        instanceId,
        currentInterval: _currentInterval,
        isRunning: _isRunning,
        isPausedByUser: _isPausedByUser,
        isPausedByVisibility: _isPausedByVisibility,
        isDestroyed: _isDestroyed
      });
    },

    healthCheck(): PollingInstanceHealthCheck {
      const lastTickAge: number | null = _metrics.lastTickAt ? Date.now() - _metrics.lastTickAt : null;
      const checks: Record<string, boolean> = {
        notDestroyed: !_isDestroyed,
        running: _isRunning,
        notStuck: !_isRunning || lastTickAge === null || lastTickAge < _currentInterval * 3,
        lowErrors: _metrics.consecutiveErrors < _config.maxErrors * 0.8
      };
      const passed: number = Object.values(checks).filter(Boolean).length;
      const total: number = Object.keys(checks).length;
      return {
        status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
        score: passed,
        maxScore: total,
        scoreDisplay: `${passed}/${total}`,
        checks,
        moduleId,
        instanceId,
        version: VERSION
      };
    },

    info(): PollingInstanceInfo {
      return {
        version: VERSION,
        moduleId,
        instanceId,
        config: Object.assign({}, _config),
        metrics: instance.getMetrics(),
        healthCheck: instance.healthCheck()
      };
    }
  };

  _registry.set(instanceId, instance);
  return instance;
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL API
// ═══════════════════════════════════════════════════════════════

export function getRegistry(): Record<string, PollingInstanceMetricsExtended> {
  const result: Record<string, PollingInstanceMetricsExtended> = {};
  _registry.forEach((inst: GovernedPollingInstance, key: string) => {
    result[key] = inst.getMetrics();
  });
  return result;
}

export function getActiveCount(): ActiveCount {
  let running: number = 0;
  let paused: number = 0;
  _registry.forEach((inst: GovernedPollingInstance) => {
    if (inst.isRunning()) running++;
    else if (inst.isPaused()) paused++;
  });
  return { total: _registry.size, running, paused };
}

export function getMetrics(): GlobalPollingMetrics & { activeInstances: number } {
  return Object.assign({}, _globalMetrics, {
    activeInstances: _registry.size
  });
}

export function resetMetrics(): void {
  (Object.keys(_globalMetrics) as Array<keyof GlobalPollingMetrics>).forEach((k: keyof GlobalPollingMetrics) => { _globalMetrics[k] = 0; });
}

export function destroyAll(): number {
  const count: number = _registry.size;
  _registry.forEach((inst: GovernedPollingInstance) => inst.destroy());
  _registry.clear();
  return count;
}

export function healthCheck(): GlobalPollingHealthCheck {
  const counts: ActiveCount = getActiveCount();
  const checks: Record<string, boolean> = {
    noOrphans: counts.total < 50,
    lowErrorRate: _globalMetrics.totalErrors < _globalMetrics.totalTicks * 0.3 || _globalMetrics.totalTicks === 0,
    visibilityGatingActive: _visibilityBound
  };
  const passed: number = Object.values(checks).filter(Boolean).length;
  const total: number = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    activeInstances: counts,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info(): Record<string, unknown> {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: getMetrics(),
    activeInstances: getActiveCount(),
    registry: getRegistry(),
    healthCheck: healthCheck()
  };
}

export default {
  VERSION,
  MODULE_ID,
  createGovernedPolling,
  getRegistry,
  getActiveCount,
  getMetrics,
  resetMetrics,
  destroyAll,
  healthCheck,
  info
};
