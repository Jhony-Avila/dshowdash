// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-kernel-health-monitor
// PURPOSE: SidebarKernel Health Monitor
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   start() — exported function
//   stop() — exported function
//   checkNow() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'sidebar-kernel-health-monitor';
export const VERSION = '1.1.0-ES6';

const DEFAULT_CONFIG = {
  intervalMs: 30000,
  degradedThreshold: 80,
  unhealthyThreshold: 50,
  autoRecover: true,
  maxRecoveryAttempts: 3,
  onDegraded: null as DynObj,
  onUnhealthy: null as DynObj,
  onRecovered: null as DynObj
};

let _kernel: DynObj | null = null;
let _config = Object.assign({}, DEFAULT_CONFIG);
let _intervalId: ReturnType<typeof setTimeout> | null = null;
let _running = false;
let _recoveryAttempts = new Map();

let _metrics = {
  checksPerformed: 0,
  degradedEvents: 0,
  unhealthyEvents: 0,
  recoveryAttempts: 0,
  recoverySuccesses: 0,
  lastCheckTime: null as number | null,
  lastStatus: null as string | null
};

let _history: DynObj[] = [];
const MAX_HISTORY = 100;

function _addToHistory(result: DynObj) {
  _history.unshift({
    timestamp: Date.now(),
    status: result.status,
    score: result.score,
    featuresHealthy: 0
  });
  if (_history.length > MAX_HISTORY) _history.pop();
}

function _checkHealth() {
  if (!_kernel) return;
  
  const result = _kernel.healthCheck();
  _metrics.checksPerformed++;
  _metrics.lastCheckTime = Date.now();
  _metrics.lastStatus = result.status;
  
  _addToHistory(result);
  
  if (result.score < _config.unhealthyThreshold) {
    _metrics.unhealthyEvents++;
    if (typeof _config.onUnhealthy === 'function') {
      try { _config.onUnhealthy(result); } catch (e) { }
    }
  } else if (result.score < _config.degradedThreshold) {
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

function _attemptRecovery(healthResult: DynObj) {
  if (!healthResult.issues) return;
  
  for (let i = 0; i < healthResult.issues.length; i++) {
    const issue = healthResult.issues[i];
    if (issue.code === 'FEATURES_ERROR') {
      const features = _kernel.listFeatures();
      if (features.ok && features.data && features.data.features) {
        for (let j = 0; j < features.data.features.length; j++) {
          const f = features.data.features[j];
          if (f.status === 'error') {
            const attempts = _recoveryAttempts.get(f.id) || 0;
            if (attempts < _config.maxRecoveryAttempts) {
              _metrics.recoveryAttempts++;
              _recoveryAttempts.set(f.id, attempts + 1);
              try {
                const result = _kernel.enableFeature(f.id);
                if (result.ok) {
                  _metrics.recoverySuccesses++;
                  _recoveryAttempts.delete(f.id);
                  if (typeof _config.onRecovered === 'function') {
                    try { _config.onRecovered(f.id); } catch (e) { }
                  }
                }
              } catch (e) { }
            }
          }
        }
      }
    }
  }
}

export function init(kernel: DynObj, config: DynObj) {
  if (_running) return { ok: true, alreadyRunning: true };
  _kernel = kernel;
  _config = Object.assign({}, DEFAULT_CONFIG, config || {});
  return { ok: true, config: Object.assign({}, _config) };
}

export function start() {
  if (_running) return { ok: true, alreadyRunning: true };
  if (!_kernel) return { ok: false, error: 'Not initialized' };
  
  _running = true;
  _checkHealth();
  _intervalId = setInterval(_checkHealth, _config.intervalMs);
  
  return { ok: true, intervalMs: _config.intervalMs };
}

export function stop() {
  if (!_running) return { ok: true, alreadyStopped: true };
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _running = false;
  return { ok: true };
}

export function checkNow() {
  return _checkHealth();
}

export function getHistory(limit: number) {
  return limit ? _history.slice(0, limit) : _history.slice();
}

export function getMetrics() {
  return Object.assign({}, _metrics, { running: _running, historySize: _history.length });
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, running: _running, intervalMs: _config.intervalMs, metrics: getMetrics() };
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
  getHistory,
  getMetrics,
  info,
  healthCheck,
  destroy
};
