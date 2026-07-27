// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/contract-audit
// PURPOSE: Auditor de contratos e governança para subcomponentes do Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   validateContract from ../components/_base/contract.js
// PROVIDES:
//   auditComponent(instance, name) — audita contrato de um componente
//   auditComponents(componentsMap) — audita múltiplos componentes
//   getAuditResult(name) — resultado de auditoria
//   getAllAuditResults() — todos os resultados
//   getInvalidComponents() — componentes inválidos
//   getComponentsWithWarnings() — componentes com warnings
//   getGovernanceScore() — score de governança
//   clearAuditResults() — limpa resultados
//   getMetrics() — métricas
//   info() — informações do módulo
//   healthCheck() — auto health check
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
// ═══════════════════════════════════════════════════════════════

// Header - Contract Audit Enterprise
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B12: var → const/let
// Auditor de contratos para subcomponentes do Header
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { validateContract } from '../components/_base/contract.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/contract-audit';

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

function _log(level: string, msg: string, data?: unknown) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
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

function _emitTelemetry(action: string, data: Record<string,unknown>) {
  const telemetry = _getPort('telemetry');
  if (telemetry && telemetry.track) {
    telemetry.track(`${MODULE_ID}:${action}`, data);
  }
}

const _auditResults = new Map();
const _metrics = {
  totalAudited: 0,
  totalValid: 0,
  totalInvalid: 0,
  totalWarnings: 0,
  lastAuditAt: (null as unknown|null)
};

export function auditComponent(instance: Record<string,unknown>, componentName: string) {
  if (!instance) {
    _log('warn', 'auditComponent called with null instance', { componentName });
    return { valid: false, issues: ['Instance is null'], warnings: [], componentName };
  }

  const result: Record<string, any> = validateContract(instance, componentName);
  
  result.governanceScore = 0;
  const maxGovernanceScore = 5;

  if (result.governance.hasId) result.governanceScore++;
  if (result.governance.hasVersion) result.governanceScore++;
  if (result.governance.hasCapabilities) result.governanceScore++;
  if (typeof instance.healthCheck === 'function') result.governanceScore++;
  if (typeof instance.info === 'function') result.governanceScore++;

  result.governanceScoreDisplay = `${result.governanceScore}/${maxGovernanceScore}`;
  result.governanceCompliant = result.governanceScore >= 3;
  result.auditedAt = Date.now();

  _auditResults.set(componentName, result);
  _metrics.totalAudited++;
  
  if (result.valid) {
    _metrics.totalValid++;
  } else {
    _metrics.totalInvalid++;
  }
  
  if (result.warnings.length > 0) {
    _metrics.totalWarnings += result.warnings.length;
  }

  _metrics.lastAuditAt = Date.now();

  if (!result.valid) {
    _log('error', `Contract INVALID: ${componentName}`, { issues: result.issues });
    _emitTelemetry('contract-invalid', { componentName, issues: result.issues });
  } else if (result.warnings.length > 0) {
    _log('warn', `Contract valid with warnings: ${componentName}`, { warnings: result.warnings });
  } else {
    _log('debug', `Contract valid: ${componentName}`, { governanceScore: result.governanceScoreDisplay });
  }

  return result;
}

export function auditComponents(componentsMap: Record<string,unknown>) {
  const results = {};
  
  if (componentsMap instanceof Map) {
    componentsMap.forEach((data, name) => {
      const instance = data.instance || data;
      (results as Record<string,unknown>)[name as string] = auditComponent(instance, name);
    });
  } else if (typeof componentsMap === 'object') {
    Object.keys(componentsMap).forEach(name => {
      const data = componentsMap[name];
      // @ts-expect-error TS migration - TS2339
      const instance = data.instance || data;
      (results as Record<string,unknown>)[name] = auditComponent(instance, name);
    });
  }

  return results;
}

export function getAuditResult(componentName: string) {
  return _auditResults.get(componentName) || null;
}

export function getAllAuditResults() {
  const results = {};
  _auditResults.forEach((result, name) => {
    (results as Record<string,unknown>)[name as string] = result;
  });
  return results;
}

export function getInvalidComponents() {
  // @ts-expect-error strict migration — TS7034
  const invalid = [];
  _auditResults.forEach((result, name) => {
    if (!result.valid) {
      invalid.push({ name, issues: result.issues });
    }
  });
  // @ts-expect-error strict migration — TS7005
  return invalid;
}

export function getComponentsWithWarnings() {
  // @ts-expect-error strict migration — TS7034
  const withWarnings = [];
  _auditResults.forEach((result, name) => {
    if (result.warnings.length > 0) {
      withWarnings.push({ name, warnings: result.warnings });
    }
  });
  // @ts-expect-error strict migration — TS7005
  return withWarnings;
}

export function getGovernanceScore() {
  if (_auditResults.size === 0) return { score: 0, maxScore: 0, percentage: '0%' };
  
  let totalScore = 0;
  const maxPossible = _auditResults.size * 5;
  
  _auditResults.forEach(result => {
    totalScore += result.governanceScore || 0;
  });

  const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
  
  return {
    score: totalScore,
    maxScore: maxPossible,
    percentage: `${percentage}%`,
    componentsAudited: _auditResults.size
  };
}

export function clearAuditResults() {
  _auditResults.clear();
  _metrics.totalAudited = 0;
  _metrics.totalValid = 0;
  _metrics.totalInvalid = 0;
  _metrics.totalWarnings = 0;
}

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function getMetrics() {
  return Object.assign({}, _metrics, {
    resultsCount: _auditResults.size
  });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics(),
    governanceScore: getGovernanceScore(),
    invalidComponents: getInvalidComponents(),
    componentsWithWarnings: getComponentsWithWarnings()
  };
}

export function healthCheck() {
  const governanceScore = getGovernanceScore();
  const invalidCount = getInvalidComponents().length;
  
  const checks = {
    hasResults: _auditResults.size > 0,
    noInvalidCritical: invalidCount === 0,
    goodGovernanceScore: parseInt(governanceScore.percentage) >= 60,
    portsInitialized: Ports.isInitialized()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= total - 1 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    governanceScore,
    portsInitialized: Ports.isInitialized()
  };
}

export default {
  VERSION,
  MODULE_ID,
  auditComponent,
  auditComponents,
  getAuditResult,
  getAllAuditResults,
  getInvalidComponents,
  getComponentsWithWarnings,
  getGovernanceScore,
  clearAuditResults,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
