// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.feature-manifest
// PURPOSE: P2 AAA+ Governance - Manifesto explícito de features
// ───────────────────────────────────────────────────────────────
// @contract KERNEL_INTERNAL - Módulo interno do kernel
// @contract FEATURE_MANIFEST - Manifesto autoritativo de features
// @contract P2_AAA_GOVERNANCE - Features não registradas são bloqueadas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FEATURE_CATEGORIES — enum de categorias
//   FLAG_SOURCES — enum de fontes de flags
//   register(featureId, definition) — registra feature
//   registerBatch(definitions) — registra múltiplas features
//   setFlag(featureId, enabled, source, changedBy) — define flag
//   getFlag(featureId) — obtém flag
//   isEnabled(featureId) — verifica se habilitada
//   isRegistered(featureId) — verifica se registrada
//   validateActivation(featureId, context) — valida ativação
//   lock() — trava manifesto
//   healthCheck() — status de saúde do módulo
//   info() — informações do módulo
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.1.0-PORTSFACTORY: Migração para PortsFactory
// @changelog v1.0.0-P2: Implementação inicial P2 AAA+ Governance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.feature-manifest';

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: unknown) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// FEATURE CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const FEATURE_CATEGORIES = Object.freeze({
  CORE: 'core',
  AUTH: 'auth',
  UI: 'ui',
  NAVIGATION: 'navigation',
  DATA: 'data',
  INTEGRATION: 'integration',
  TELEMETRY: 'telemetry',
  EXPERIMENTAL: 'experimental'
});

// ═══════════════════════════════════════════════════════════════
// FEATURE FLAGS (governadas pelo Kernel)
// ═══════════════════════════════════════════════════════════════

export const FLAG_SOURCES = Object.freeze({
  MANIFEST: 'manifest',
  KERNEL: 'kernel',
  REMOTE: 'remote',
  OVERRIDE: 'override'
});

// ═══════════════════════════════════════════════════════════════
// MANIFEST STORE
// ═══════════════════════════════════════════════════════════════

let _manifest: Record<string, Record<string, unknown>> = {};
let _flags: Record<string, Record<string, unknown>> = {};
let _categories: Record<string, string[]> = {};
let _locked = false;
let _metrics = {
  registered: 0,
  flagChanges: 0,
  lockViolations: 0,
  unregisteredBlocks: 0
};

// ═══════════════════════════════════════════════════════════════
// LOGGER (via PortsFactory)
// ═══════════════════════════════════════════════════════════════

const _log = (level: string, message: string, data?: unknown) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getPort('logger');
  if (logger && logger[level]) {
    logger[level](`${prefix} ${message}`, data || {});
  }
};

// ═══════════════════════════════════════════════════════════════
// MANIFEST REGISTRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Registra uma feature no manifesto
 * @param {string} featureId - ID único da feature
 * @param {object} definition - Definição da feature
 */
export function register(featureId: string, definition: Record<string, unknown>) {
  if (_locked) {
    _metrics.lockViolations++;
    _log('error', 'Manifest is locked - cannot register new features', { featureId });
    return { ok: false, error: 'Manifest is locked', featureId };
  }

  if (_manifest[featureId]) {
    _log('warn', 'Feature already registered in manifest', { featureId });
    return { ok: false, error: 'Feature already registered', featureId };
  }

  const def = {
    id: featureId,
    name: definition.name || featureId,
    description: definition.description || '',
    category: definition.category || FEATURE_CATEGORIES.CORE,
    version: definition.version || '1.0.0',
    // Governance
    requiresAuth: definition.requiresAuth || false,
    requiresReady: definition.requiresReady !== false,
    minLevel: definition.minLevel || 0,
    requiredCapability: definition.requiredCapability || null,
    requiredCapabilities: definition.requiredCapabilities || [],
    // Dependencies
    dependencies: definition.dependencies || [],
    softDependencies: definition.softDependencies || [],
    // Flags
    defaultEnabled: definition.defaultEnabled !== false,
    canDisable: definition.canDisable !== false,
    experimental: definition.experimental || false,
    deprecated: definition.deprecated || false,
    // Health
    healthWeight: definition.healthWeight || 1,
    critical: definition.critical || false,
    // Meta
    owner: definition.owner || 'system',
    documentation: definition.documentation || null,
    registeredAt: Date.now()
  };

  _manifest[featureId] = def;

  // Inicializar flag
  _flags[featureId] = {
    enabled: def.defaultEnabled,
    source: FLAG_SOURCES.MANIFEST,
    lastChanged: Date.now(),
    changedBy: 'manifest'
  };

  // Indexar por categoria
  const cat = def.category as string;
  if (!_categories[cat]) {
    _categories[cat] = [];
  }
  _categories[cat].push(featureId);

  _metrics.registered++;
  _log('info', 'Feature registered in manifest', { featureId, category: cat });

  return { ok: true, featureId, definition: def };
}

/**
 * Registra múltiplas features de uma vez
 */
export function registerBatch(definitions: Record<string, Record<string, unknown>>) {
  const results = [];
  for (const featureId in definitions) {
    results.push(register(featureId, definitions[featureId]));
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// FLAG MANAGEMENT (governado pelo Kernel)
// ═══════════════════════════════════════════════════════════════

/**
 * Define o estado de uma flag
 * @param {string} featureId - ID da feature
 * @param {boolean} enabled - Estado desejado
 * @param {string} source - Origem da mudança
 * @param {string} changedBy - Quem fez a mudança
 */
export function setFlag(featureId: string, enabled: boolean, source: string, changedBy: string) {
  if (!_manifest[featureId]) {
    _log('warn', 'Cannot set flag for unregistered feature', { featureId });
    return { ok: false, error: 'Feature not in manifest', featureId };
  }

  const def = _manifest[featureId];

  // P2: Verificar se pode desabilitar
  if (!enabled && !def.canDisable) {
    _log('warn', 'Feature cannot be disabled', { featureId });
    return { ok: false, error: 'Feature cannot be disabled', featureId };
  }

  const oldEnabled = _flags[featureId] ? _flags[featureId].enabled : def.defaultEnabled;

  _flags[featureId] = {
    enabled,
    source: source || FLAG_SOURCES.OVERRIDE,
    lastChanged: Date.now(),
    changedBy: changedBy || 'unknown',
    previousValue: oldEnabled
  };

  _metrics.flagChanges++;
  _log('info', 'Flag changed', { featureId, enabled, source });

  return { ok: true, featureId, enabled, previousValue: oldEnabled };
}

/**
 * Obtém o estado de uma flag
 */
export function getFlag(featureId: string) {
  if (!_flags[featureId]) {
    if (_manifest[featureId]) {
      return { enabled: _manifest[featureId].defaultEnabled, source: FLAG_SOURCES.MANIFEST };
    }
    return null;
  }
  return Object.assign({}, _flags[featureId]);
}

/**
 * Verifica se uma feature está habilitada
 */
export function isEnabled(featureId: string) {
  const flag = getFlag(featureId);
  return flag ? flag.enabled : false;
}

/**
 * Sincroniza flags com o Runtime Kernel
 */
export function syncWithKernel(kernelFlags: Record<string, boolean>) {
  if (!kernelFlags) return { ok: false, error: 'No kernel flags provided' };

  let synced = 0;
  for (const featureId in kernelFlags) {
    if (_manifest[featureId]) {
      setFlag(featureId, kernelFlags[featureId], FLAG_SOURCES.KERNEL, 'kernel-sync');
      synced++;
    }
  }

  _log('info', 'Flags synced with kernel', { synced });
  return { ok: true, synced };
}

// ═══════════════════════════════════════════════════════════════
// MANIFEST QUERIES
// ═══════════════════════════════════════════════════════════════

export function get(featureId: string) {
  return _manifest[featureId] ? Object.assign({}, _manifest[featureId]) : null;
}

export function getAll() {
  const result: Record<string, unknown> = {};
  for (const id in _manifest) {
    result[id] = Object.assign({}, _manifest[id]);
  }
  return result;
}

export function getByCategory(category: string) {
  const ids = _categories[category] || [];
  return ids.map((id: string) => Object.assign({}, _manifest[id]));
}

export function getCategories() {
  const result: Record<string, number> = {};
  for (const cat in _categories) {
    result[cat] = _categories[cat].length;
  }
  return result;
}

export function getCriticalFeatures() {
  const result = [];
  for (const id in _manifest) {
    if (_manifest[id].critical) {
      result.push(id);
    }
  }
  return result;
}

export function getExperimentalFeatures() {
  const result = [];
  for (const id in _manifest) {
    if (_manifest[id].experimental) {
      result.push(id);
    }
  }
  return result;
}

export function getDeprecatedFeatures() {
  const result = [];
  for (const id in _manifest) {
    if (_manifest[id].deprecated) {
      result.push(id);
    }
  }
  return result;
}

/**
 * P2: Verifica se uma feature está no manifesto
 */
export function isRegistered(featureId: string) {
  return !!_manifest[featureId];
}

/**
 * P2: Valida se uma feature pode ser ativada (anti-regressão)
 */
export function validateActivation(featureId: string, runtimeContext: unknown) {
  if (!_manifest[featureId]) {
    _metrics.unregisteredBlocks++;
    return {
      valid: false,
      error: 'Feature not registered in manifest',
      code: 'UNREGISTERED'
    };
  }

  const def = _manifest[featureId];
  const flag = getFlag(featureId);

  // Verificar flag
  if (!flag!.enabled) {
    return {
      valid: false,
      error: 'Feature flag is disabled',
      code: 'FLAG_DISABLED',
      source: flag!.source
    };
  }

  // Verificar deprecated
  if (def.deprecated) {
    _log('warn', 'Activating deprecated feature', { featureId });
  }

  // Verificar capabilities requeridas
  const requiredCaps = def.requiredCapabilities as string[] | undefined;
  const ctx = runtimeContext as Record<string, unknown> | null;
  if (ctx && requiredCaps && requiredCaps.length > 0) {
    for (let i = 0; i < requiredCaps.length; i++) {
      const cap = requiredCaps[i];
      if (ctx.isCapabilityEnabled && !(ctx.isCapabilityEnabled as (c: string) => boolean)(cap)) {
        return {
          valid: false,
          error: `Required capability not enabled: ${cap}`,
          code: 'CAPABILITY_MISSING',
          capability: cap
        };
      }
    }
  }

  return { valid: true, definition: def };
}

// ═══════════════════════════════════════════════════════════════
// MANIFEST LOCK (anti-regressão)
// ═══════════════════════════════════════════════════════════════

/**
 * Trava o manifesto para impedir novas registrações
 * Deve ser chamado após o boot completo
 */
export function lock() {
  _locked = true;
  _log('info', 'Manifest locked', { featuresRegistered: _metrics.registered });
  return { ok: true, featuresRegistered: _metrics.registered };
}

export function unlock(secret: string) {
  if (secret !== '__KERNEL_UNLOCK__') {
    _metrics.lockViolations++;
    _log('error', 'Invalid unlock attempt');
    return { ok: false, error: 'Invalid unlock secret' };
  }
  _locked = false;
  _log('warn', 'Manifest unlocked');
  return { ok: true };
}

export function isLocked() {
  return _locked;
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    locked: _locked,
    totalFeatures: Object.keys(_manifest).length,
    categories: getCategories(),
    criticalCount: getCriticalFeatures().length,
    experimentalCount: getExperimentalFeatures().length,
    deprecatedCount: getDeprecatedFeatures().length,
    portsInitialized: _Ports.isInitialized(),
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const checks = {
    manifestPopulated: Object.keys(_manifest).length > 0,
    noLockViolations: _metrics.lockViolations === 0,
    noUnregisteredBlocks: _metrics.unregisteredBlocks === 0
  };

  let passed = 0;
  let total = 0;
  for (const key in checks) {
    total++;
    if ((checks as Record<string, unknown>)[key]) passed++;
  }

  return {
    status: passed === total ? 'HEALTHY' : (passed > 0 ? 'DEGRADED' : 'UNHEALTHY'),
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    score: { passed, total },
    checks,
    locked: _locked,
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export function reset() {
  _manifest = {};
  _flags = {};
  _categories = {};
  _locked = false;
  _metrics = { registered: 0, flagChanges: 0, lockViolations: 0, unregisteredBlocks: 0 };
  _log('info', 'Manifest reset');
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  // Constants
  FEATURE_CATEGORIES,
  FLAG_SOURCES,
  // Ports
  injectPorts,
  getPorts,
  // Registration
  register,
  registerBatch,
  // Flags
  setFlag,
  getFlag,
  isEnabled,
  syncWithKernel,
  // Queries
  get,
  getAll,
  getByCategory,
  getCategories,
  getCriticalFeatures,
  getExperimentalFeatures,
  getDeprecatedFeatures,
  isRegistered,
  validateActivation,
  // Lock
  lock,
  unlock,
  isLocked,
  // Diagnostics
  info,
  healthCheck,
  reset
};
