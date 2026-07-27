
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-FIX-RECURSION)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/health-aggregator
// PURPOSE: Agrega health checks de todos os subcomponentes do Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   aggregate(sources) — agrega health de múltiplas fontes
//   aggregateHeader(headerInstance) — agrega health do Header completo
//   getLastResult() — retorna último resultado de agregação
//   getProblematicComponents() — lista componentes problemáticos
//   getQuickSummary() — resumo rápido do health
//   getMetrics() — métricas de agregação
//   info() — informações do módulo
//   healthCheck() — auto health check
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
// ═══════════════════════════════════════════════════════════════

// Header Health Aggregator - Enterprise AAA
// @version 1.2.0-FIX-RECURSION
// @changelog v1.2.0-FIX-RECURSION - CRITICAL FIX: Removed headerInstance.healthCheck() call from aggregateHeader to break infinite recursion (Header.healthCheck → aggregateHeader → Header.healthCheck → ...)
// @changelog v1.1.0-ES6 - Task 10.1 B12: var → const/let
// Agrega health checks de todos os subcomponentes do Header
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-FIX-RECURSION';
export const MODULE_ID = 'header/core/health-aggregator';

const Ports = createUiPorts({ moduleId: MODULE_ID });
let _initialized = false;

function _initPorts() {
  if (_initialized) return;
  Ports.init();
  _initialized = true;
}

function _getPort(name: string) {
  _initPorts();
  return Ports.get(name);
}

function _log(level: string, msg: string, data?: Record<string,unknown>) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[' + MODULE_ID + ']';
  if (level === 'error') {
    logger.error && logger.error(prefix, msg, data || '');
  } else if (level === 'warn') {
    logger.warn && logger.warn(prefix, msg, data || '');
  } else if (level === 'info') {
    logger.info && logger.info(prefix, msg, data || '');
  } else {
    const config = _getPort('config');
    if (config && config.app && config.app.debug) {
      logger.debug && logger.debug(prefix, msg, data || '');
    }
  }
}

const _metrics = {
  aggregationCount: 0,
  lastAggregationAt: (null as unknown|null),
  totalComponentsChecked: 0,
  healthyCount: 0,
  degradedCount: 0,
  unhealthyCount: 0
};

let _lastResult: unknown = null;

const STATUS_WEIGHTS = {
  'HEALTHY': 1.0,
  'MOUNTED': 1.0,
  'DEGRADED': 0.5,
  'UNHEALTHY': 0.0,
  'FAILED': 0.0,
  'TIMEOUT': 0.0,
  'ERROR': 0.0,
  'NO_HEALTHCHECK': 0.7,
  'UNKNOWN': 0.3
};

function normalizeStatus(status: string) {
  if (!status) return 'UNKNOWN';
  return String(status).toUpperCase();
}

function calculateComponentScore(healthResult: unknown) {
  if (!healthResult) return 0;

  // @ts-expect-error TS migration - TS2339
  const status = normalizeStatus(healthResult.status);
  let baseScore = (STATUS_WEIGHTS as Record<string,unknown>)[status] !== undefined ? (STATUS_WEIGHTS as Record<string,unknown>)[status] : 0.3;

  // @ts-expect-error TS migration - TS2339
  if (healthResult.score !== undefined && healthResult.maxScore) {
    // @ts-expect-error TS migration - TS2339
    const componentScore = healthResult.score / healthResult.maxScore;
    // @ts-expect-error TS migration - TS2365
    baseScore = (baseScore + componentScore) / 2;
  }

  return baseScore;
}

export function aggregate(sources: unknown) {
  _initPorts();
  _metrics.aggregationCount++;
  _metrics.lastAggregationAt = Date.now();

  const results = {
    timestamp: Date.now(),
    components: {},
    summary: {
      total: 0,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      noHealthCheck: 0
    },
    overallScore: 0,
    overallStatus: 'UNKNOWN'
  };

  let totalScore = 0;
  let componentCount = 0;

  // @ts-expect-error strict migration — TS2769
  Object.keys(sources).forEach(function(sourceName) {
    const source = (sources as Record<string,unknown>)[sourceName];

    if (!source) return;

    // @ts-expect-error TS migration - TS2339
    if (typeof source === 'object' && !source.status) {
      Object.keys(source).forEach(function(componentName) {
        // @ts-expect-error strict migration — TS7053
        const health = source[componentName];
        // @ts-expect-error TS migration - TS2345
        processComponent(componentName, health, results, sourceName);
        componentCount++;
        // @ts-expect-error TS migration - TS2365
        totalScore += calculateComponentScore(health);
      });
    }
    // @ts-expect-error TS migration - TS2339
    else if (source.status) {
      // @ts-expect-error TS migration - TS2345
      processComponent(sourceName, source, results, 'direct');
      componentCount++;
      // @ts-expect-error TS migration - TS2365
      totalScore += calculateComponentScore(source);
    }
  });

  results.summary.total = componentCount;
  results.overallScore = componentCount > 0 ? Math.round((totalScore / componentCount) * 100) : 0;

  if (results.overallScore >= 90) {
    results.overallStatus = 'HEALTHY';
  } else if (results.overallScore >= 60) {
    results.overallStatus = 'DEGRADED';
  } else {
    results.overallStatus = 'UNHEALTHY';
  }

  _metrics.totalComponentsChecked = componentCount;
  _metrics.healthyCount = results.summary.healthy;
  _metrics.degradedCount = results.summary.degraded;
  _metrics.unhealthyCount = results.summary.unhealthy;

  _lastResult = results;

  _log('info', 'Health aggregation complete', {
    total: componentCount,
    score: results.overallScore,
    status: results.overallStatus
  });

  return results;
}

function processComponent(name: string, health: unknown, results: unknown[], source: string) {
  // @ts-expect-error TS migration - TS2339
  const status = normalizeStatus(health ? health.status : 'UNKNOWN');

  // @ts-expect-error TS migration - TS2339
  results.components[name] = {
    status: status,
    score: calculateComponentScore(health),
    source: source,
    details: health,
    checkedAt: Date.now()
  };

  if (status === 'HEALTHY' || status === 'MOUNTED') {
    // @ts-expect-error TS migration - TS2339
    results.summary.healthy++;
  } else if (status === 'DEGRADED') {
    // @ts-expect-error TS migration - TS2339
    results.summary.degraded++;
  } else if (status === 'NO_HEALTHCHECK') {
    // @ts-expect-error TS migration - TS2339
    results.summary.noHealthCheck++;
  } else {
    // @ts-expect-error TS migration - TS2339
    results.summary.unhealthy++;
  }
}

// v1.2.0-FIX-RECURSION: CRITICAL FIX
// Previously this function called headerInstance.healthCheck() which in turn
// called aggregateHeader() again, creating infinite recursion:
//   Header.healthCheck() → diagnostics.healthCheck() → aggregateHeader() → headerInstance.healthCheck() → ...
// Now we ONLY aggregate subcomponents without calling the header's own healthCheck.
export function aggregateHeader(headerInstance: Record<string,unknown>) {
  if (!headerInstance) {
    _log('warn', 'Header instance not provided');
    return null;
  }

  const sources = {};

  // v1.2.0: DO NOT call headerInstance.healthCheck() here — it causes infinite recursion!
  // Instead, collect basic header state as a synthetic health result
  (sources as Record<string,unknown>)['header-core'] = {
    status: headerInstance._mounted ? 'HEALTHY' : 'UNHEALTHY',
    mounted: !!headerInstance._mounted,
    version: headerInstance.VERSION || 'unknown'
  };

  if (headerInstance.componentsLoader) {
    // @ts-expect-error TS migration - TS2339
    if (headerInstance.componentsLoader.getSubcomponentsHealth) {
      // @ts-expect-error TS migration - TS2339
      (sources as Record<string,unknown>)['subcomponents'] = headerInstance.componentsLoader.getSubcomponentsHealth();
    }
    // @ts-expect-error TS migration - TS2339
    if (headerInstance.componentsLoader.healthCheck) {
      // @ts-expect-error TS migration - TS2339
      (sources as Record<string,unknown>)['components-loader'] = headerInstance.componentsLoader.healthCheck();
    }
  }

  // @ts-expect-error TS migration - TS2339
  if (headerInstance.routerIntegration && headerInstance.routerIntegration.healthCheck) {
    // @ts-expect-error TS migration - TS2339
    (sources as Record<string,unknown>)['router-integration'] = headerInstance.routerIntegration.healthCheck();
  }

  // @ts-expect-error TS migration - TS2339
  if (headerInstance.fallbackManager && headerInstance.fallbackManager.healthCheck) {
    // @ts-expect-error TS migration - TS2339
    (sources as Record<string,unknown>)['fallback-manager'] = headerInstance.fallbackManager.healthCheck();
  }

  // @ts-expect-error TS migration - TS2339
  if (headerInstance.events && headerInstance.events.healthCheck) {
    // @ts-expect-error TS migration - TS2339
    (sources as Record<string,unknown>)['events'] = headerInstance.events.healthCheck();
  }

  return aggregate(sources);
}

export function getLastResult() {
  return _lastResult;
}

export function getProblematicComponents() {
  if (!_lastResult) return [];

  // @ts-expect-error strict migration — TS7034
  const problematic = [];

  // @ts-expect-error TS migration - TS2339
  Object.keys(_lastResult.components).forEach(function(name) {
    // @ts-expect-error TS migration - TS2339
    const comp = _lastResult.components[name];
    if (comp.status !== 'HEALTHY' && comp.status !== 'MOUNTED') {
      problematic.push({
        name: name,
        status: comp.status,
        score: comp.score,
        source: comp.source
      });
    }
  });

  // @ts-expect-error strict migration — TS7005
  return problematic;
}

export function getQuickSummary() {
  if (!_lastResult) {
    return {
      status: 'UNKNOWN',
      score: 0,
      message: 'No aggregation performed yet'
    };
  }

  // @ts-expect-error TS migration - TS2339
  const summary = _lastResult.summary;
  let message = summary.healthy + ' healthy';

  if (summary.degraded > 0) {
    message += ', ' + summary.degraded + ' degraded';
  }
  if (summary.unhealthy > 0) {
    message += ', ' + summary.unhealthy + ' unhealthy';
  }

  return {
    // @ts-expect-error TS migration - TS2339
    status: _lastResult.overallStatus,
    // @ts-expect-error TS migration - TS2339
    score: _lastResult.overallScore,
    message: message,
    total: summary.total
  };
}

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics(),
    lastResult: _lastResult ? {
      // @ts-expect-error TS migration - TS2339
      status: _lastResult.overallStatus,
      // @ts-expect-error TS migration - TS2339
      score: _lastResult.overallScore,
      // @ts-expect-error TS migration - TS2339
      componentsCount: _lastResult.summary.total,
      // @ts-expect-error TS migration - TS2339
      timestamp: _lastResult.timestamp
    } : null,
    problematicComponents: getProblematicComponents()
  };
}

export function healthCheck() {
  const checks = {
    initialized: _initialized,
    hasLastResult: !!_lastResult,
    // @ts-expect-error TS migration - TS2363
    recentAggregation: _metrics.lastAggregationAt && (Date.now() - _metrics.lastAggregationAt) < 300000,
    portsInitialized: Ports.isInitialized()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: passed + '/' + total,
    checks: checks,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized()
  };
}

export default {
  VERSION: VERSION,
  MODULE_ID: MODULE_ID,
  aggregate: aggregate,
  aggregateHeader: aggregateHeader,
  getLastResult: getLastResult,
  getProblematicComponents: getProblematicComponents,
  getQuickSummary: getQuickSummary,
  getMetrics: getMetrics,
  info: info,
  healthCheck: healthCheck,
  injectPorts: injectPorts,
  getPorts: getPorts
};
