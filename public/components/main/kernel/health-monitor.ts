// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-kernel-health-monitor
// PURPOSE: MainKernel Health Monitor
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from /assets/js/core/logger-global/index.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setLogLevel() — exported function
//   init() — exported function
//   start() — exported function
//   stop() — exported function
//   checkNow() — exported function
//   updateConfig() — exported function
//   getHistory() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   destroy() — exported function
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
import { createLogger } from '/assets/js/core/logger-global/index.js';

type LogLevelName = 'debug' | 'info' | 'warn' | 'error' | 'none';

interface HealthMonitorConfig {
  intervalMs: number;
  degradedThreshold: number;
  unhealthyThreshold: number;
  autoRecover: boolean;
  maxRecoveryAttempts: number;
  logLevel: number;
  onDegraded: ((result: HealthResultSnapshot) => void) | null;
  onUnhealthy: ((result: HealthResultSnapshot) => void) | null;
  onRecovered: ((featureId: string) => void) | null;
}

interface HealthResultSnapshot {
  status: string;
  score: { passed: number; total: number; percentage: number };
  features: Record<string, { status: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface HealthHistoryEntry {
  timestamp: number;
  status: string;
  score: number;
  featuresHealthy: number;
  featuresTotal: number;
}

interface KernelHealthApi {
  healthCheck(): HealthResultSnapshot;
  enableFeature(featureId: string): { ok: boolean; [key: string]: unknown };
  listFeatures(): { ok: boolean; data: { features: Array<{ id: string; [key: string]: unknown }>; [key: string]: unknown }; [key: string]: unknown };
}

declare const _logLevel: unknown;
export const MODULE_ID = 'main-kernel-health-monitor';
const _logger = createLogger(MODULE_ID);
export const VERSION = '1.2.0-ENTERPRISE';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: HealthMonitorConfig = {
  intervalMs: 30000,
  degradedThreshold: 80,
  unhealthyThreshold: 50,
  autoRecover: true,
  maxRecoveryAttempts: 3,
  logLevel: 1,
  onDegraded: null,
  onUnhealthy: null,
  onRecovered: null
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _kernel: KernelHealthApi | null = null;
let _config: HealthMonitorConfig = { ...DEFAULT_CONFIG };
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _running = false;
let _recoveryAttempts = new Map();

let _metrics: {
  checksPerformed: number;
  degradedEvents: number;
  unhealthyEvents: number;
  recoveryAttempts: number;
  recoverySuccesses: number;
  lastCheckTime: number | null;
  lastStatus: string | null;
} = {
  checksPerformed: 0,
  degradedEvents: 0,
  unhealthyEvents: 0,
  recoveryAttempts: 0,
  recoverySuccesses: 0,
  lastCheckTime: null,
  lastStatus: null
};

let _history: HealthHistoryEntry[] = [];
const MAX_HISTORY = 100;

// ═══════════════════════════════════════════════════════════════
// INTERNAL LOGGING
// ═══════════════════════════════════════════════════════════════

const LOG_LEVELS: Record<LogLevelName, number> = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };

function _log(level: LogLevelName, msg: string, data?: unknown) {
  const levelNum = LOG_LEVELS[level] || 1;
  const threshold: number = (typeof _logLevel !== 'undefined' ? Number(_logLevel) : (typeof _config !== 'undefined' && _config && _config.logLevel ? _config.logLevel : 1));
  if (levelNum < threshold) return;
  const context = data !== undefined ? { data } : {};
  if (level === 'error') _logger.error(msg, context);
  else if (level === 'warn') _logger.warn(msg, context);
  else if (level === 'debug') _logger.debug(msg, context);
  else _logger.info(msg, context);
}

export function setLogLevel(level: string | number): number {
  if (typeof level === 'string') {
    _config.logLevel = LOG_LEVELS[level as LogLevelName] !== undefined ? LOG_LEVELS[level as LogLevelName] : 1;
  } else if (typeof level === 'number') {
    _config.logLevel = level;
  }
  return _config.logLevel;
}

// ═══════════════════════════════════════════════════════════════
// PRIVATE
// ═══════════════════════════════════════════════════════════════

function _addToHistory(result: HealthResultSnapshot) {
  _history.unshift({
    timestamp: Date.now(),
    status: result.status,
    score: result.score.percentage,

    featuresHealthy: Object.values(result.features).filter((f: { status: string; [key: string]: unknown }) => f.status === 'HEALTHY').length,
    featuresTotal: Object.keys(result.features).length
  });
  
  if (_history.length > MAX_HISTORY) {
    _history.pop();
  }
}

function _checkHealth() {
  if (!_kernel) return;
  
  const result = _kernel.healthCheck();
  _metrics.checksPerformed++;
  _metrics.lastCheckTime = Date.now();
  _metrics.lastStatus = result.status;
  
  _addToHistory(result);
  
  if (result.score.percentage < _config.unhealthyThreshold) {
    _metrics.unhealthyEvents++;
    if (typeof _config.onUnhealthy === 'function') {
      try { _config.onUnhealthy(result); } catch (e) { }
    }
  } else if (result.score.percentage < _config.degradedThreshold) {
    _metrics.degradedEvents++;
    if (typeof _config.onDegraded === 'function') {
      try { _config.onDegraded(result); } catch (e) { }
    }
  }
  
  if (_config.autoRecover) {
    _attemptRecovery(result);
  }
  
  return result;
}

function _attemptRecovery(healthResult: HealthResultSnapshot) {
  for (const [featureId, health] of Object.entries(healthResult.features)) {

    if (health.status === 'ERROR' || health.status === 'NOT_INITIALIZED') {
      const attempts = _recoveryAttempts.get(featureId) || 0;
      
      if (attempts < _config.maxRecoveryAttempts) {
        _metrics.recoveryAttempts++;
        _recoveryAttempts.set(featureId, attempts + 1);
        
        try {
          const result = _kernel!.enableFeature(featureId);
          if (result.ok) {
            _metrics.recoverySuccesses++;
            _recoveryAttempts.delete(featureId);
            
            if (typeof _config.onRecovered === 'function') {
              try { _config.onRecovered(featureId); } catch (e) { }
            }
            

            _log('info', `Recovered feature: ${featureId}`);
          }
        } catch (e) {
          _log('warn', `Recovery failed for: ${featureId}`, (e as Error).message);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function init(kernel: KernelHealthApi, config: Partial<HealthMonitorConfig> = {}) {
  if (_running) {
    return { ok: true, alreadyRunning: true };
  }
  
  _kernel = kernel;
  _config = { ...DEFAULT_CONFIG, ...config };
  
  return { ok: true, config: { ..._config } };
}

export function start() {
  if (_running) return { ok: true, alreadyRunning: true };
  if (!_kernel) return { ok: false, error: 'Not initialized' };
  
  _running = true;
  
  _checkHealth();
  
  _intervalId = setInterval(_checkHealth, _config.intervalMs);
  

  _log('debug', `Started with interval: ${_config.intervalMs}ms`);
  
  return { ok: true, intervalMs: _config.intervalMs };
}

export function stop() {
  if (!_running) return { ok: true, alreadyStopped: true };
  
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  
  _running = false;
  

  _log('debug', 'Stopped');
  
  return { ok: true };
}

export function checkNow() {
  return _checkHealth();
}

export function updateConfig(newConfig: Partial<HealthMonitorConfig>) {
  const wasRunning = _running;
  
  if (wasRunning) stop();
  
  _config = { ...DEFAULT_CONFIG, ..._config, ...newConfig };
  
  if (wasRunning) start();
  
  return { ok: true, config: { ..._config } };
}

export function getHistory(limit?: number) {
  return limit ? _history.slice(0, limit) : [..._history];
}

export function getMetrics() {
  return {
    ..._metrics,
    running: _running,
    historySize: _history.length,
    config: { ..._config }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    running: _running,
    intervalMs: _config.intervalMs,
    metrics: getMetrics()
  };
}

export function healthCheck() {
  return {
    status: _running ? 'HEALTHY' : 'NOT_RUNNING',
    moduleId: MODULE_ID,
    version: VERSION,
    running: _running,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

export function destroy() {
  stop();
  _kernel = null;
  _history = [];
  _recoveryAttempts.clear();
  return { ok: true };
}

export default {
  MODULE_ID,
  VERSION,
  init,
  start,
  stop,
  checkNow,
  updateConfig,
  getHistory,
  getMetrics,
  setLogLevel,
  info,
  healthCheck,
  destroy
};
