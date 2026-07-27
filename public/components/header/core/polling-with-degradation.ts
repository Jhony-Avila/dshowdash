// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/polling-with-degradation
// PURPOSE: Integra graceful-degradation com sistema de polling
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   * as GracefulDegradation from ./graceful-degradation.js
//   * as FeatureFlags from ./feature-flags.js
// PROVIDES:
//   init(pollingManager, config) — inicializa integração
//   executePoll(pollType, pollFn) — executa poll com degradação
//   degradePolling(pollType, reason) — degrada tipo de polling
//   reactivatePolling(pollType) — reativa tipo de polling
//   isPollingDegraded(pollType) — verifica se está degradado
//   getPollingStatus() — status de todos os pollings
//   getMetrics() — métricas
//   resetMetrics() — reseta métricas
//   healthCheck() — auto health check
//   info() — informações do módulo
//   POLLING_FEATURES — constantes de features de polling
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
// WINDOW ACCESS:
//   navigator.onLine — verificar conectividade
// ═══════════════════════════════════════════════════════════════

// Header - Polling with Graceful Degradation
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B11: var → const/let
// @description Integra graceful-degradation com sistema de polling
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import * as GracefulDegradation from './graceful-degradation.js';
import * as FeatureFlags from './feature-flags.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/polling-with-degradation';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) logger.error(prefix, args.join(' ')); else if (level === 'warn' && logger.warn) logger.warn(prefix, args.join(' ')); else if (level === 'info' && logger.info) logger.info(prefix, args.join(' ')); };

let _initialized = false;
let _pollingManager: Record<string,unknown>|null = null;
let _degradationEnabled = false;

const _metrics = {
  pollsExecuted: 0,
  pollsDegraded: 0,
  pollsSkipped: 0,
  degradationEvents: 0,
  reactivationEvents: 0,
  lastPollAt: (null as unknown|null)
};

const POLLING_FEATURES = {
  health: 'polling:health',
  alerts: 'polling:alerts',
  notifications: 'polling:notifications',
  sync: 'polling:sync'
};

export function init(pollingManager: Record<string,unknown>, config: Record<string,unknown>) {
  if (_initialized) return;
  
  _initPorts();
  _pollingManager = pollingManager;
  
  _degradationEnabled = FeatureFlags.isEnabled('gracefulDegradationEnabled');
  
  if (!_degradationEnabled) {
    _log('info', 'Graceful degradation desabilitado');
    _initialized = true;
    return;
  }
  
  _registerPollingFeatures(config);
  
  _initialized = true;
  _log('info', 'Polling with degradation inicializado');
}

function _registerPollingFeatures(config: Record<string,unknown>) {
  config = config || {};
  
  GracefulDegradation.registerFeature(POLLING_FEATURES.health, {
    name: 'Health Polling',
    dependencies: ['network', 'api'],
    critical: true,
    checkInterval: config.healthCheckInterval || 60000,
    healthCheck() {
      if (!_pollingManager) return true;
      // @ts-expect-error TS migration - TS2349
      const hc = _pollingManager.healthCheck ? _pollingManager.healthCheck() : { status: 'HEALTHY' };
      return hc.status === 'HEALTHY' || hc.status === 'DEGRADED';
    },
    onDegrade(data: Record<string,unknown>) {
      _metrics.degradationEvents++;
      _log('warn', 'Health polling degradado:', data.reason);
      _pausePolling('health');
    },
    onReactivate() {
      _metrics.reactivationEvents++;
      _log('info', 'Health polling reativado');
      _resumePolling('health');
    }
  });
  
  GracefulDegradation.registerFeature(POLLING_FEATURES.alerts, {
    name: 'Alerts Polling',
    dependencies: ['network', 'api'],
    critical: false,
    checkInterval: config.alertsCheckInterval || 30000,
    healthCheck() {
      return navigator.onLine;
    },
    onDegrade(data: Record<string,unknown>) {
      _metrics.degradationEvents++;
      _log('warn', 'Alerts polling degradado:', data.reason);
      _pausePolling('alerts');
    },
    onReactivate() {
      _metrics.reactivationEvents++;
      _log('info', 'Alerts polling reativado');
      _resumePolling('alerts');
    }
  });
}

function _pausePolling(type: string) {
  if (!_pollingManager) return;
  
  if (typeof _pollingManager.pause === 'function') {
    _pollingManager.pause(type);
  } else if (typeof _pollingManager.stop === 'function') {
    _pollingManager.stop();
  }
}

function _resumePolling(type: string) {
  if (!_pollingManager) return;
  
  if (typeof _pollingManager.resume === 'function') {
    _pollingManager.resume(type);
  } else if (typeof _pollingManager.start === 'function') {
    _pollingManager.start();
  }
}

export function executePoll(pollType: string, pollFn: Function) {
  _metrics.lastPollAt = Date.now();
  
  if (!_degradationEnabled) {
    _metrics.pollsExecuted++;
    return pollFn();
  }
  
  const featureId = (POLLING_FEATURES as Record<string,unknown>)[pollType as string] || pollType;
  
  // @ts-expect-error TS migration - TS2345
  if (GracefulDegradation.isFeatureDegraded(featureId)) {
    _metrics.pollsSkipped++;
    _log('debug', 'Poll skipped (degraded):', pollType);
    return Promise.resolve({ skipped: true, reason: 'FEATURE_DEGRADED' });
  }
  
  // @ts-expect-error TS migration - TS2345
  return GracefulDegradation.withFeature(featureId, () => {
    _metrics.pollsExecuted++;
    return pollFn();
  }, (error: unknown) => {
    _metrics.pollsDegraded++;
    _log('warn', 'Poll executado em modo degradado:', pollType);
    // @ts-expect-error TS migration - TS2339
    return { degraded: true, error: error.message };
  });
}

export function degradePolling(pollType: string, reason: string) {
  if (!_degradationEnabled) return false;
  
  const featureId = (POLLING_FEATURES as Record<string,unknown>)[pollType as string] || pollType;
  // @ts-expect-error TS migration - TS2345
  return GracefulDegradation.degradeFeature(featureId, reason);
}

export function reactivatePolling(pollType: string) {
  if (!_degradationEnabled) return false;
  
  const featureId = (POLLING_FEATURES as Record<string,unknown>)[pollType as string] || pollType;
  // @ts-expect-error TS migration - TS2345
  return GracefulDegradation.reactivateFeature(featureId);
}

export function isPollingDegraded(pollType: string) {
  if (!_degradationEnabled) return false;
  
  const featureId = (POLLING_FEATURES as Record<string,unknown>)[pollType as string] || pollType;
  // @ts-expect-error TS migration - TS2345
  return GracefulDegradation.isFeatureDegraded(featureId);
}

export function getPollingStatus() {
  const status = {};
  
  Object.keys(POLLING_FEATURES).forEach(type => {
    const featureId = (POLLING_FEATURES as Record<string,unknown>)[type];
    (status as Record<string,unknown>)[type] = {
      featureId,
      // @ts-expect-error TS migration - TS2345
      degraded: _degradationEnabled ? GracefulDegradation.isFeatureDegraded(featureId) : false,
      // @ts-expect-error TS migration - TS2345
      available: _degradationEnabled ? GracefulDegradation.isFeatureAvailable(featureId) : true
    };
  });
  
  return status;
}

export function getMetrics() {
  return Object.assign({}, _metrics, {
    degradationEnabled: _degradationEnabled,
    pollingStatus: getPollingStatus()
  });
}

export function resetMetrics() {
  _metrics.pollsExecuted = 0;
  _metrics.pollsDegraded = 0;
  _metrics.pollsSkipped = 0;
  _metrics.degradationEvents = 0;
  _metrics.reactivationEvents = 0;
  _metrics.lastPollAt = null;
}

export function healthCheck() {
  const pollingStatus = getPollingStatus();
  // @ts-expect-error strict migration — TS2345
  const anyDegraded = Object.values(pollingStatus).some((s: Record<string, unknown>) => s.degraded);
  
  const checks = {
    initialized: _initialized,
    hasPollingManager: !!_pollingManager,
    noDegradedPolling: !anyDegraded,
    lowSkipRate: (_metrics.pollsExecuted + _metrics.pollsSkipped) === 0 ||
      (_metrics.pollsSkipped / (_metrics.pollsExecuted + _metrics.pollsSkipped)) < 0.3,
    portsInitialized: Ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    pollingStatus,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    degradationEnabled: _degradationEnabled,
    pollingFeatures: POLLING_FEATURES,
    pollingStatus: getPollingStatus(),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}

export { POLLING_FEATURES };

export default {
  VERSION,
  MODULE_ID,
  POLLING_FEATURES,
  init,
  executePoll,
  degradePolling,
  reactivatePolling,
  isPollingDegraded,
  getPollingStatus,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
