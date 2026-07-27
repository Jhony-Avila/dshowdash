// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/manifest-audit
// PURPOSE: Auditor de manifest vs disco para subcomponentes do Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   VERSION, MODULE_ID — identificacao do modulo
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
//   loadManifest() — carrega manifest.json do componente
//   getManifestComponents(manifest) — extrai lista de componentes do manifest
//   getDiskComponents(componentsLoader) — extrai componentes carregados em disco
//   detectDrift(manifestComponents, diskComponents) — detecta diferencas manifest vs disco
//   runAudit(componentsLoader) — executa auditoria completa
//   getLastAuditResult() — retorna ultimo resultado de auditoria
//   getMetrics() — metricas do modulo
//   info() — informacoes do modulo
//   healthCheck() — health check do modulo
// ═══════════════════════════════════════════════════════════════

// Header - Manifest Audit Enterprise
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B11: var → const/let
// Auditor de manifest vs disco para subcomponentes do Header
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/manifest-audit';

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

function _emitTelemetry(action: string, data: Record<string,unknown>) {
  const telemetry = _getPort('telemetry');
  if (telemetry && telemetry.track) {
    telemetry.track(MODULE_ID + ':' + action, data);
  }
}

let _lastAuditResult: Record<string,unknown>|null = null;
const _metrics = {
  auditCount: 0,
  lastAuditAt: (null as unknown|null),
  driftDetected: false,
  missingInDisk: 0,
  missingInManifest: 0
};

const IGNORED_DIRS = ['_base', 'node_modules', '.git'];
const IGNORED_FILES = ['index.js', 'manifest.json', 'README.md', 'ATENCAO.txt'];

export function loadManifest() {
  return import('../components/manifest.json', { assert: { type: 'json' } })
    .then(function(module) {
      return module.default || module;
    })
    .catch(function(error) {
      _log('warn', 'Falha ao carregar manifest via import, tentando fetch');
      return fetch('/components/header/components/manifest.json')
        .then(function(response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        });
    });
}

export function getManifestComponents(manifest: Record<string,unknown>) {
  if (!manifest) return [];
  
  if (Array.isArray(manifest.components)) {
    return manifest.components.map(function(c: unknown) {
      // @ts-expect-error TS migration - TS2339
      return c.key || c.component_key || c.name || c.id;
    }).filter(Boolean);
  }
  
  if (Array.isArray(manifest)) {
    return manifest.map(function(c) {
      return c.key || c.component_key || c.name || c.id;
    }).filter(Boolean);
  }
  
  if (manifest.items && Array.isArray(manifest.items)) {
    return manifest.items.map(function(c: unknown) {
      // @ts-expect-error TS migration - TS2339
      return c.key || c.component_key || c.name || c.id;
    }).filter(Boolean);
  }

  return [];
}

export function getDiskComponents(componentsLoader: Record<string,unknown>) {
  if (!componentsLoader) {
    _log('warn', 'ComponentsLoader não disponível para auditoria de disco');
    return [];
  }

  if (componentsLoader.componentsList && Array.isArray(componentsLoader.componentsList)) {
    return componentsLoader.componentsList.map(function(c: unknown) {
      // @ts-expect-error TS migration - TS2339
      return c.name || c.key;
    }).filter(Boolean);
  }

  if (componentsLoader.components instanceof Map) {
    return Array.from(componentsLoader.components.keys());
  }

  return [];
}

export function detectDrift(manifestComponents: unknown, diskComponents: unknown) {
  // @ts-expect-error strict migration — TS7034
  const missingInDisk = [];
  // @ts-expect-error strict migration — TS7034
  const missingInManifest = [];
  // @ts-expect-error strict migration — TS7034
  const matched = [];

  // @ts-expect-error TS migration - TS2339
  manifestComponents.forEach(function(comp: unknown) {
    // @ts-expect-error TS migration - TS2339
    if (diskComponents.indexOf(comp) === -1) {
      missingInDisk.push(comp);
    } else {
      matched.push(comp);
    }
  });

  // @ts-expect-error TS migration - TS2339
  diskComponents.forEach(function(comp: unknown) {
    // @ts-expect-error TS migration - TS2339
    if (manifestComponents.indexOf(comp) === -1) {
      missingInManifest.push(comp);
    }
  });

  const hasDrift = missingInDisk.length > 0 || missingInManifest.length > 0;

  return {
    hasDrift: hasDrift,
    // @ts-expect-error strict migration — TS7005
    missingInDisk: missingInDisk,
    // @ts-expect-error strict migration — TS7005
    missingInManifest: missingInManifest,
    // @ts-expect-error strict migration — TS7005
    matched: matched,
    // @ts-expect-error TS migration - TS2339
    manifestCount: manifestComponents.length,
    // @ts-expect-error TS migration - TS2339
    diskCount: diskComponents.length,
    matchedCount: matched.length
  };
}

export function runAudit(componentsLoader: Record<string,unknown>) {
  _initPorts();
  _metrics.auditCount++;
  _metrics.lastAuditAt = Date.now();

  return loadManifest()
    .then(function(manifest) {
      const manifestComponents = getManifestComponents(manifest);
      const diskComponents = getDiskComponents(componentsLoader);
      
      const driftResult = detectDrift(manifestComponents, diskComponents);
      
      _lastAuditResult = {
        timestamp: Date.now(),
        manifest: manifestComponents,
        disk: diskComponents,
        drift: driftResult,
        manifestVersion: manifest.version || 'unknown'
      };

      _metrics.driftDetected = driftResult.hasDrift;
      _metrics.missingInDisk = driftResult.missingInDisk.length;
      _metrics.missingInManifest = driftResult.missingInManifest.length;

      if (driftResult.hasDrift) {
        _log('warn', 'Drift detectado no manifest', {
          missingInDisk: driftResult.missingInDisk,
          missingInManifest: driftResult.missingInManifest
        });
        _emitTelemetry('drift-detected', {
          missingInDisk: driftResult.missingInDisk.length,
          missingInManifest: driftResult.missingInManifest.length
        });
      } else {
        _log('info', 'Manifest sincronizado com disco', {
          matchedCount: driftResult.matchedCount
        });
      }

      return _lastAuditResult;
    })
    .catch(function(error) {
      _log('error', 'Erro na auditoria de manifest', { error: error.message });
      _lastAuditResult = {
        timestamp: Date.now(),
        error: error.message,
        drift: { hasDrift: false, missingInDisk: ([] as unknown[]), missingInManifest: ([] as unknown[]), matched: ([] as unknown[]) }
      };
      return _lastAuditResult;
    });
}

export function getLastAuditResult() {
  return _lastAuditResult;
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
    lastAuditResult: _lastAuditResult
  };
}

export function healthCheck() {
  const checks = {
    auditRan: _metrics.auditCount > 0,
    noDrift: !_metrics.driftDetected,
    noMissingInDisk: _metrics.missingInDisk === 0,
    portsInitialized: Ports.isInitialized()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= total - 1 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: passed + '/' + total,
    checks: checks,
    version: VERSION,
    moduleId: MODULE_ID,
    driftDetected: _metrics.driftDetected,
    portsInitialized: Ports.isInitialized()
  };
}

export default {
  VERSION: VERSION,
  MODULE_ID: MODULE_ID,
  loadManifest: loadManifest,
  getManifestComponents: getManifestComponents,
  getDiskComponents: getDiskComponents,
  detectDrift: detectDrift,
  runAudit: runAudit,
  getLastAuditResult: getLastAuditResult,
  getMetrics: getMetrics,
  info: info,
  healthCheck: healthCheck,
  injectPorts: injectPorts,
  getPorts: getPorts
};