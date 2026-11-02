// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-GOVERNANCE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.health-aggregator
// PURPOSE: CORE Health Management - Agregação de health por categorias
// ───────────────────────────────────────────────────────────────
// @contract KERNEL_INTERNAL - Módulo interno do kernel
// @contract HEALTH_OWNER - Owner da agregação de health do sistema
// @contract GOVERNANCE - Inclui categoria governance para strict-mode (v1.3.0)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, healthCheck as strictModeHealth from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   HEALTH_STATUS — enum de status (HEALTHY, DEGRADED, UNHEALTHY, CRITICAL, UNKNOWN)
//   init() — inicializa o agregador
//   report(featureId, category, status, details) — reporta health de feature
//   getFeatureHealth(featureId) — obtém health de feature
//   getCategoryHealth(category) — obtém health de categoria
//   getGlobalHealth() — obtém health global
//   getFullReport() — relatório completo
//   subscribe(callback) — subscribe a mudanças
//   healthCheck() — status de saúde do módulo
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//
// @changelog v1.3.0-GOVERNANCE: Categoria governance para strict-mode, strictMode no healthCheck
// @changelog v1.2.0-P2-ENTERPRISE: Improved DEPENDENCY CONTRACT, standardized MODULE_ID
// @changelog v1.1.0-PORTSFACTORY: Migração para PortsFactory (elimina window.Logger)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, healthCheck as strictModeHealth } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '1.3.0-GOVERNANCE';
export const MODULE_ID = 'core.kernel.health-aggregator';

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: unknown) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const HEALTH_STATUS = Object.freeze({
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN'
});

const STATUS_PRIORITY = Object.freeze({
  HEALTHY: 0,
  UNKNOWN: 1,
  DEGRADED: 2,
  UNHEALTHY: 3,
  CRITICAL: 4
});

const CATEGORY_DEFAULTS = Object.freeze({
  core: { weight: 10, critical: true },
  auth: { weight: 9, critical: true },
  governance: { weight: 8, critical: true },  // v1.3.0: Categoria para strict-mode e políticas
  ui: { weight: 5, critical: false },
  navigation: { weight: 6, critical: false },
  data: { weight: 7, critical: false },
  integration: { weight: 4, critical: false },
  telemetry: { weight: 2, critical: false },
  experimental: { weight: 1, critical: false }
});

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _featureHealth: Record<string, unknown> = {};
let _categoryHealth: Record<string, Record<string, unknown>> = {};
let _globalHealth: string = HEALTH_STATUS.UNKNOWN;
let _listeners: ((...args: unknown[]) => unknown)[] = [];
let _initialized = false;

// ═══════════════════════════════════════════════════════════════
// LOGGER
// ═══════════════════════════════════════════════════════════════

const _log = (level: string, message: string, data?: unknown) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getPort('logger');
  if (logger && logger[level]) {
    logger[level](`${prefix} ${message}`, data || {});
  }
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function init() {
  if (_initialized) return { ok: true, alreadyInitialized: true };

  Object.keys(CATEGORY_DEFAULTS).forEach(cat => {
    const catDefaults = (CATEGORY_DEFAULTS as Record<string, { weight: number; critical: boolean }>)[cat];
    _categoryHealth[cat] = {
      status: HEALTH_STATUS.UNKNOWN,
      features: {},
      weight: catDefaults.weight,
      critical: catDefaults.critical,
      lastUpdate: null
    };
  });

  _initialized = true;

  // v1.3.0: Registrar strict-mode automaticamente na categoria governance
  _registerStrictModeHealth();

  _log('info', 'HealthAggregator initialized', { categories: Object.keys(CATEGORY_DEFAULTS).length });
  return { ok: true };
}

/**
 * v1.3.0: Registra o health do strict-mode automaticamente
 * @private
 */
function _registerStrictModeHealth() {
  try {
    const smHealth = strictModeHealth();
    report('enterprise-strict-mode', 'governance', smHealth.status, {
      strictModeActive: isStrict(),
      scorePercentage: smHealth.scorePercentage,
      recentViolations: smHealth.summary?.recentCount || 0,
      topOffenders: smHealth.topOffenders || []
    });
  } catch (e: any) {
    _log('warn', 'Failed to register strict-mode health', { error: e.message });
  }
}

/**
 * v1.3.0: Atualiza o health do strict-mode (pode ser chamado periodicamente)
 */
export function updateStrictModeHealth() {
  if (!_initialized) return false;
  _registerStrictModeHealth();
  return true;
}

// ═══════════════════════════════════════════════════════════════
// REPORT HEALTH
// ═══════════════════════════════════════════════════════════════

export function report(featureId: string, category: string, status: string, details: unknown) {
  if (!featureId || !category || !status) {
    _log('warn', 'Invalid health report', { featureId, category, status });
    return false;
  }

  if (!(HEALTH_STATUS as Record<string, string>)[status]) {
    _log('warn', 'Unknown health status', { status });
    return false;
  }

  const now = Date.now();
  const previousEntry = _featureHealth[featureId] as Record<string, unknown> | undefined;
  const previousStatus = previousEntry ? previousEntry.status : null;

  _featureHealth[featureId] = {
    category,
    status,
    details: details || {},
    lastUpdate: now,
    previousStatus
  };

  if (!_categoryHealth[category]) {
    _categoryHealth[category] = {
      status: HEALTH_STATUS.UNKNOWN,
      features: {},
      weight: 3,
      critical: false,
      lastUpdate: null
    };
  }

  (_categoryHealth[category].features as Record<string, unknown>)[featureId] = status;
  _categoryHealth[category].lastUpdate = now;

  recalculateCategoryHealth(category);
  recalculateGlobalHealth();

  if (previousStatus && previousStatus !== status) {
    _log('info', 'Health changed', {
      featureId,
      from: previousStatus,
      to: status
    });
    _notifyListeners({
      type: 'health:changed',
      featureId,
      category,
      from: previousStatus,
      to: status
    });
  }

  return true;
}

export function reportBatch(reports: Array<{ featureId: string; category: string; status: string; details: unknown }>) {
  if (!Array.isArray(reports)) return false;
  const results: unknown[] = [];
  reports.forEach(r => {
    results.push(report(r.featureId, r.category, r.status, r.details));
  });
  return results;
}

export function remove(featureId: string) {
  if (!_featureHealth[featureId]) return false;
  const category = (_featureHealth[featureId] as Record<string, unknown>).category as string;
  delete _featureHealth[featureId];

  if (_categoryHealth[category] && (_categoryHealth[category].features as Record<string, unknown>)[featureId]) {
    delete (_categoryHealth[category].features as Record<string, unknown>)[featureId];
    recalculateCategoryHealth(category);
    recalculateGlobalHealth();
  }

  _log('debug', 'Health entry removed', { featureId });
  return true;
}

// ═══════════════════════════════════════════════════════════════
// RECALCULATION
// ═══════════════════════════════════════════════════════════════

export function recalculateCategoryHealth(category: string) {
  const cat = _categoryHealth[category];
  if (!cat) return;

  const features = (cat.features || {}) as Record<string, unknown>;
  const featureIds = Object.keys(features);

  if (featureIds.length === 0) {
    cat.status = HEALTH_STATUS.UNKNOWN;
    return;
  }

  let worstPriority = 0;
  featureIds.forEach(fid => {
    const st = features[fid] as string;
    const priority = (STATUS_PRIORITY as Record<string, number>)[st] || 0;
    if (priority > worstPriority) worstPriority = priority;
  });

  const statusMap: Record<number, string> = {};
  Object.keys(STATUS_PRIORITY).forEach(k => {
    statusMap[(STATUS_PRIORITY as Record<string, number>)[k]] = k;
  });

  cat.status = statusMap[worstPriority] || HEALTH_STATUS.UNKNOWN;
}

export function recalculateGlobalHealth() {
  const categories = Object.keys(_categoryHealth);
  if (categories.length === 0) {
    _globalHealth = HEALTH_STATUS.UNKNOWN;
    return;
  }

  let worstPriority = 0;
  let criticalDegraded = false;

  categories.forEach(catName => {
    const cat = _categoryHealth[catName];
    const priority = (STATUS_PRIORITY as Record<string, number>)[cat.status as string] || 0;

    if (cat.critical && priority >= STATUS_PRIORITY.DEGRADED) {
      criticalDegraded = true;
    }

    if (priority > worstPriority) worstPriority = priority;
  });

  const statusMap: Record<number, string> = {};
  Object.keys(STATUS_PRIORITY).forEach(k => {
    statusMap[(STATUS_PRIORITY as Record<string, number>)[k]] = k;
  });

  let newGlobal = statusMap[worstPriority] || HEALTH_STATUS.UNKNOWN;

  if (criticalDegraded && newGlobal === HEALTH_STATUS.DEGRADED) {
    newGlobal = HEALTH_STATUS.UNHEALTHY;
  }

  if (_globalHealth !== newGlobal) {
    const prev = _globalHealth;
    _globalHealth = newGlobal;
    _log('info', 'Global health changed', { from: prev, to: newGlobal });
    _notifyListeners({ type: 'global:health:changed', from: prev, to: newGlobal });
  }
}

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

export function getFeatureHealth(featureId: string) {
  return _featureHealth[featureId] || null;
}

export function getCategoryHealth(category: string) {
  return _categoryHealth[category] || null;
}

export function getGlobalHealth() {
  return _globalHealth;
}

export function getFullReport() {
  return {
    global: _globalHealth,
    categories: JSON.parse(JSON.stringify(_categoryHealth)),
    features: JSON.parse(JSON.stringify(_featureHealth)),
    timestamp: Date.now()
  };
}

export function getCategorySummary() {
  const summary: Record<string, unknown> = {};
  Object.keys(_categoryHealth).forEach(cat => {
    summary[cat] = {
      status: _categoryHealth[cat].status,
      featureCount: Object.keys((_categoryHealth[cat].features || {}) as Record<string, unknown>).length,
      critical: _categoryHealth[cat].critical
    };
  });
  return summary;
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════

export function subscribe(callback: (...args: unknown[]) => unknown) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter(l => l !== callback);
  };
}

function _notifyListeners(event: unknown) {
  _listeners.forEach(fn => {
    try { fn(event); } catch (e: any) {
      _log('error', 'Listener error', { error: (e as Error).message });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════

export function reset() {
  _featureHealth = {};
  Object.keys(_categoryHealth).forEach(cat => {
    (_categoryHealth[cat] as Record<string, unknown>).features = {};
    (_categoryHealth[cat] as Record<string, unknown>).status = HEALTH_STATUS.UNKNOWN;
    (_categoryHealth[cat] as Record<string, unknown>).lastUpdate = null;
  });
  _globalHealth = HEALTH_STATUS.UNKNOWN;
  _log('info', 'HealthAggregator reset');
}

export function destroy() {
  _featureHealth = {};
  _categoryHealth = {};
  _globalHealth = HEALTH_STATUS.UNKNOWN;
  _listeners = [];
  _initialized = false;
  _log('info', 'HealthAggregator destroyed');
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK (self)
// ═══════════════════════════════════════════════════════════════

export function healthCheck() {
  const checks = {
    initialized: _initialized,
    globalHealthy: _globalHealth === 'HEALTHY' || _globalHealth === 'DEGRADED',
    categoriesConfigured: Object.keys(_categoryHealth).length >= 5,
    featuresTracked: Object.keys(_featureHealth).length > 0,
    portsInitialized: _Ports.isInitialized()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: _initialized ? (passed === total ? 'HEALTHY' : 'DEGRADED') : 'UNHEALTHY',
    score: `${passed}/${total}`,
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    portsInitialized: _Ports.isInitialized(),
    checks,
    globalHealth: _globalHealth,
    categoriesCount: Object.keys(_categoryHealth).length,
    featuresTracked: Object.keys(_featureHealth).length,
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    strictMode: isStrict(),
    globalHealth: _globalHealth,
    categoriesCount: Object.keys(_categoryHealth).length,
    featuresTracked: Object.keys(_featureHealth).length,
    listenersCount: _listeners.length,
    portsInitialized: _Ports.isInitialized(),
    categories: Object.keys(_categoryHealth),
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  init,
  destroy,
  reset,
  report,
  reportBatch,
  remove,
  recalculateCategoryHealth,
  recalculateGlobalHealth,
  getFeatureHealth,
  getCategoryHealth,
  getGlobalHealth,
  getFullReport,
  getCategorySummary,
  subscribe,
  updateStrictModeHealth,  // v1.3.0
  healthCheck,
  info,
  injectPorts,
  getPorts,
  HEALTH_STATUS,
  VERSION,
  MODULE_ID
};
