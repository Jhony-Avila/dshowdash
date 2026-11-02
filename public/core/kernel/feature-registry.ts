// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.feature-registry
// PURPOSE: Registry centralizado de features para kernels
// ───────────────────────────────────────────────────────────────
// @contract KERNEL_INTERNAL - Módulo interno do kernel
// @contract FEATURE_REGISTRY - Registry de features com governance
// @contract P1_GOVERNANCE - Suporte a P0/P1 governance, cascatas, recovery
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FEATURE_STATUS, PRIORITY, validateDependencies, getDependents from ./base-kernel.js
//   RuntimeConsumer from ./runtime-consumer.js
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RECOVERY_CONFIG — default recovery configuration
//   createFeatureRegistry(options) — factory para criar registry
//   healthCheck() — status de saúde do módulo
//   info() — informações do módulo
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//
// @changelog v1.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT, added healthCheck, info
// @changelog v1.3.0-PORTSFACTORY: Migração para PortsFactory
// @changelog v1.2.0-P1: P1 Elevação Governada
// @changelog v1.1.0-P0: Integração com RuntimeContext
// ═══════════════════════════════════════════════════════════════
'use strict';

import { FEATURE_STATUS, PRIORITY, validateDependencies, getDependents, type FeatureMap } from './base-kernel.js';
import RuntimeConsumer from './runtime-consumer.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.feature-registry';

// ═══════════════════════════════════════════════════════════════
// MODULE-LEVEL PORTS
// ═══════════════════════════════════════════════════════════════

const _ModulePorts = createCorePorts({ moduleId: MODULE_ID });
function _getModulePort(name: string) { return _ModulePorts.get(name); }
export function injectPorts(p: unknown) { return _ModulePorts.inject(p); }
export function getPorts() { return _ModulePorts.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// P1: RECOVERY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const RECOVERY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  degradedMaxAttempts: 1,
  degradedDelayMultiplier: 3
};

// ═══════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════

export function createFeatureRegistry(options: Record<string, unknown>) {
  options = options || {};
  const moduleId = options.moduleId || 'kernel';
  const logger = options.logger || null;

  // P0: Controle de governança
  let _governanceEnabled = options.governanceEnabled !== false;

  // P1: Configuração de recovery customizável
  const _recoveryConfig: typeof RECOVERY_CONFIG & Record<string, unknown> = Object.assign({}, RECOVERY_CONFIG, (options.recoveryConfig as Record<string, unknown>) || {});

  let _features: FeatureMap = {};
  let _metrics = {
    registrations: 0,
    enables: 0,
    disables: 0,
    errors: 0,
    // P0: Métricas de governança
    blockedByContext: 0,
    blockedByMaintenance: 0,
    blockedByAuth: 0,
    recoveryBlocked: 0,
    // P1: Métricas de elevação
    cascadesSuspended: 0,
    recoveryBackoffs: 0,
    capabilityBlocks: 0
  };

  // Logger interno: prioridade options.logger > PortsFactory > silêncio
  const _log = (level: string, message: string, data?: unknown) => {
    const prefix = `[${MODULE_ID}]`;
    // 1. Logger explícito passado nas options
    const typedLogger = logger as Record<string, (...args: unknown[]) => void> | null;
    if (typedLogger && typedLogger[level]) {
      typedLogger[level](`${prefix} ${message}`, data || {});
      return;
    }
    // 2. Logger via PortsFactory (módulo-level)
    const portLogger = _getModulePort('logger') as Record<string, (...args: unknown[]) => void> | null;
    if (portLogger && portLogger[level]) {
      portLogger[level](`${prefix} ${message}`, data || {});
    }
  };

  // ─────────────────────────────────────────────────────────────
  // P0: RUNTIME CONTEXT CHECKS
  // ─────────────────────────────────────────────────────────────

  function _checkRuntimeContext(featureId: string, featureConfig: Record<string, unknown>): { allowed: boolean; reason?: string; [key: string]: unknown } {
    if (!_governanceEnabled) {
      return { allowed: true, governanceDisabled: true };
    }

    // Inicializar consumer se necessário
    if (!RuntimeConsumer.hasContext()) {
      RuntimeConsumer.init();
    }

    // Se ainda não há contexto, permitir (durante boot inicial)
    if (!RuntimeConsumer.hasContext()) {
      _log('debug', 'RuntimeContext not available - allowing feature during boot', { featureId });
      return { allowed: true, contextMissing: true };
    }

    // P0: Verificar com RuntimeContext
    const check = RuntimeConsumer.canEnableFeature({
      requiresReady: featureConfig.requiresReady !== false,
      requiresAuth: featureConfig.requiresAuth || false,
      minLevel: featureConfig.minLevel || 0
    }) as { allowed: boolean; reason?: string };

    if (!check.allowed) {
      _log('warn', 'Feature blocked by RuntimeContext', {
        featureId,
        reason: check.reason,
        mode: RuntimeConsumer.getMode(),
        phase: RuntimeConsumer.getPhase()
      });

      // Atualizar métricas
      _metrics.blockedByContext++;
      if (RuntimeConsumer.isInMaintenance()) {
        _metrics.blockedByMaintenance++;
      }
      if (check.reason && check.reason.indexOf('Authentication') >= 0) {
        _metrics.blockedByAuth++;
      }
    }

    return check;
  }

  function _checkRecoveryAllowed(featureId: string): { allowed: boolean; reason?: string; [key: string]: unknown } {
    if (!_governanceEnabled) {
      return { allowed: true, governanceDisabled: true };
    }

    if (!RuntimeConsumer.hasContext()) {
      RuntimeConsumer.init();
    }

    if (!RuntimeConsumer.hasContext()) {
      return { allowed: true, contextMissing: true };
    }

    const check = RuntimeConsumer.canAttemptRecovery() as { allowed: boolean; reason?: string };

    if (!check.allowed) {
      _log('warn', 'Recovery blocked by RuntimeContext', {
        featureId,
        reason: check.reason
      });
      _metrics.recoveryBlocked++;
    }

    return check;
  }

  // ─────────────────────────────────────────────────────────────
  // P1: CAPABILITY CHECKS
  // ─────────────────────────────────────────────────────────────

  function _checkCapability(featureId: string, featureConfig: Record<string, unknown>) {
    if (!_governanceEnabled) {
      return { allowed: true, governanceDisabled: true };
    }

    if (!RuntimeConsumer.hasContext()) {
      return { allowed: true, contextMissing: true };
    }

    const ctx = RuntimeConsumer.getContext() as unknown as Record<string, unknown> | null;
    if (!ctx) {
      return { allowed: true, contextMissing: true };
    }

    // P1: Verificar capacidades específicas da feature
    const requiredCapability = featureConfig.requiredCapability;
    if (requiredCapability && ctx.isCapabilityEnabled) {
      if (!(ctx.isCapabilityEnabled as (cap: unknown) => boolean)(requiredCapability)) {
        _log('warn', 'Feature blocked by capability check', {
          featureId,
          requiredCapability
        });
        _metrics.capabilityBlocks++;
        return {
          allowed: false,
          reason: `Capability not enabled: ${requiredCapability}`
        };
      }
    }

    // P1: Verificar capacidades implícitas baseadas no tipo de feature
    if (featureConfig.requiresUI && ctx.canShowUI && !(ctx.canShowUI as () => boolean)()) {
      _metrics.capabilityBlocks++;
      return { allowed: false, reason: 'UI capability not available' };
    }

    if (featureConfig.requiresNavigation && ctx.canNavigate && !(ctx.canNavigate as () => boolean)()) {
      _metrics.capabilityBlocks++;
      return { allowed: false, reason: 'Navigation capability not available' };
    }

    return { allowed: true };
  }

  // ─────────────────────────────────────────────────────────────
  // P1: CASCADE CONTROL
  // ─────────────────────────────────────────────────────────────

  function _shouldSuspendCascade() {
    if (!_governanceEnabled) {
      return false;
    }

    if (!RuntimeConsumer.hasContext()) {
      return false;
    }

    // P1: Suspender cascatas em modo DEGRADED
    if (RuntimeConsumer.isDegraded()) {
      _log('info', 'Cascade suspended - system in DEGRADED mode');
      _metrics.cascadesSuspended++;
      return true;
    }

    // P1: Suspender cascatas em RECOVERY
    if (RuntimeConsumer.isInRecovery()) {
      _log('info', 'Cascade suspended - system in RECOVERY mode');
      _metrics.cascadesSuspended++;
      return true;
    }

    return false;
  }

  // ─────────────────────────────────────────────────────────────
  // P1: RECOVERY BACKOFF
  // ─────────────────────────────────────────────────────────────

  function _calculateRecoveryDelay(feature: Record<string, unknown>) {
    const attempts = ((feature.recoveryAttempts as number) || 0);
    const isDegraded = RuntimeConsumer.isDegraded();

    // P1: Usar config reduzida em modo degraded
    const maxAttempts = isDegraded ? _recoveryConfig.degradedMaxAttempts : _recoveryConfig.maxAttempts;
    const delayMultiplier = isDegraded ? _recoveryConfig.degradedDelayMultiplier : 1;

    // Calcular delay exponencial
    let delay = _recoveryConfig.baseDelayMs * Math.pow(_recoveryConfig.backoffMultiplier, attempts) * delayMultiplier;
    delay = Math.min(delay, _recoveryConfig.maxDelayMs);

    return {
      delay,
      attempts,
      maxAttempts,
      canRetry: attempts < maxAttempts,
      isDegraded
    };
  }

  function _shouldAllowRecoveryAttempt(feature: Record<string, unknown>) {
    const backoff = _calculateRecoveryDelay(feature);

    if (!backoff.canRetry) {
      _log('warn', 'Recovery max attempts reached', {
        featureId: feature.id,
        attempts: backoff.attempts,
        maxAttempts: backoff.maxAttempts
      });
      return { allowed: false, reason: 'Max recovery attempts reached', backoff };
    }

    // Verificar cooldown
    const lastAttempt = ((feature.lastRecoveryAttempt as number) || 0);
    const elapsed = Date.now() - lastAttempt;

    if (elapsed < backoff.delay) {
      _log('debug', 'Recovery in cooldown', {
        featureId: feature.id,
        remainingMs: backoff.delay - elapsed
      });
      _metrics.recoveryBackoffs++;
      return {
        allowed: false,
        reason: 'Recovery in cooldown',
        remainingMs: backoff.delay - elapsed,
        backoff
      };
    }

    return { allowed: true, backoff };
  }

  // ─────────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────────

  function register(featureId: string, config: Record<string, unknown>) {
    if (_features[featureId]) {
      return { ok: false, error: `Feature already registered: ${featureId}` };
    }

    _features[featureId] = {
      id: featureId,
      status: FEATURE_STATUS.REGISTERED,
      priority: config.priority !== undefined ? (config.priority as number) : PRIORITY.NORMAL,
      enabled: config.enabled !== false,
      dependencies: config.dependencies || [],
      module: config.module || null,
      init: config.init || null,
      cleanup: config.cleanup || null,
      healthCheck: config.healthCheck || null,
      // P0: Configuração de governança
      requiresReady: config.requiresReady !== false,
      requiresAuth: config.requiresAuth || false,
      minLevel: config.minLevel || 0,
      // P1: Configuração de capacidades
      requiredCapability: config.requiredCapability || null,
      requiresUI: config.requiresUI || false,
      requiresNavigation: config.requiresNavigation || false,
      // Métricas
      errorCount: 0,
      lastError: null,
      initDurationMs: null,
      registeredAt: Date.now(),
      // P0: Tracking de bloqueios
      lastBlockedAt: null,
      lastBlockReason: null,
      blockCount: 0,
      // P1: Tracking de recovery
      recoveryAttempts: 0,
      lastRecoveryAttempt: null,
      totalRecoveries: 0
    };

    _metrics.registrations++;
    return { ok: true, featureId };
  }

  // ─────────────────────────────────────────────────────────────
  // ENABLE (com P0 governance + P1 capabilities)
  // ─────────────────────────────────────────────────────────────

  function enable(featureId: string, options: Record<string, unknown>) {
    options = options || {};
    const feature = _features[featureId];

    if (!feature) {
      return { ok: false, error: `Feature not found: ${featureId}` };
    }

    if (feature.status === FEATURE_STATUS.ENABLED) {
      return { ok: true, alreadyEnabled: true };
    }

    // P0: Verificar RuntimeContext ANTES de qualquer ação
    if (!options.skipGovernanceCheck) {
      const contextCheck = _checkRuntimeContext(featureId, feature);
      if (!contextCheck.allowed) {
        feature.lastBlockedAt = Date.now();
        feature.lastBlockReason = contextCheck.reason;
        feature.blockCount = ((feature.blockCount as number) || 0) + 1;
        return {
          ok: false,
          error: `Blocked by RuntimeContext: ${contextCheck.reason}`,
          blockedByGovernance: true,
          reason: contextCheck.reason
        };
      }

      // P1: Verificar capacidades
      const capabilityCheck = _checkCapability(featureId, feature);
      if (!capabilityCheck.allowed) {
        feature.lastBlockedAt = Date.now();
        feature.lastBlockReason = capabilityCheck.reason;
        feature.blockCount = ((feature.blockCount as number) || 0) + 1;
        return {
          ok: false,
          error: `Blocked by capability: ${capabilityCheck.reason}`,
          blockedByCapability: true,
          reason: capabilityCheck.reason
        };
      }
    }

    // Validate dependencies
    if (!options.skipDependencyCheck) {
      const depCheck = validateDependencies(featureId, _features, id => _features[id] ? (_features[id].dependencies as string[]) : []);

      if (!depCheck.valid) {
        return { ok: false, error: 'Dependencies not met', missing: depCheck.missing, disabled: depCheck.disabled };
      }
    }

    // Initialize
    const startTime = Date.now();
    try {
      if (feature.init) {
        const ctx = (options.ctx || {}) as Record<string, unknown>;
        // P0: Passar snapshot do RuntimeContext para o init
        if (RuntimeConsumer.hasContext()) {
          ctx.runtimeSnapshot = RuntimeConsumer.getSnapshot();
        }
        (feature.init as (ctx: unknown) => void)(ctx);
      }

      feature.status = FEATURE_STATUS.ENABLED;
      feature.initDurationMs = Date.now() - startTime;
      // P1: Reset recovery tracking on successful enable
      feature.recoveryAttempts = 0;
      _metrics.enables++;

      _log('info', 'Feature enabled', {
        featureId,
        initDurationMs: feature.initDurationMs,
        mode: RuntimeConsumer.getMode()
      });

      return { ok: true, featureId, initDurationMs: feature.initDurationMs };

    } catch (e) {
      feature.status = FEATURE_STATUS.ERROR;
      feature.errorCount = ((feature.errorCount as number) || 0) + 1;
      feature.lastError = (e as Error).message;
      _metrics.errors++;

      _log('error', 'Feature enable failed', { featureId, error: (e as Error).message });

      return { ok: false, error: (e as Error).message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DISABLE (com P1 cascade control)
  // ─────────────────────────────────────────────────────────────

  function disable(featureId: string, options: Record<string, unknown>) {
    options = options || {};
    const feature = _features[featureId];

    if (!feature) {
      return { ok: false, error: `Feature not found: ${featureId}` };
    }

    if (feature.status !== FEATURE_STATUS.ENABLED) {
      return { ok: true, alreadyDisabled: true };
    }

    // Check dependents
    const dependentsList = getDependents(featureId, _features, id => _features[id] ? (_features[id].dependencies as string[]) : []);

    const enabledDependents = dependentsList.filter(id => _features[id] && _features[id].status === FEATURE_STATUS.ENABLED);

    if (enabledDependents.length > 0 && !options.cascade) {
      return { ok: false, error: 'Feature has enabled dependents', dependents: enabledDependents };
    }

    // P1: Verificar se deve suspender cascade
    const cascadeDisabled = [];
    if (options.cascade && enabledDependents.length > 0) {
      // P1: Em modo degraded/recovery, NÃO propagar cascade
      if (_shouldSuspendCascade() && !options.forceCascade) {
        _log('warn', 'Cascade disabled suspended due to system mode', {
          featureId,
          pendingDependents: enabledDependents,
          mode: RuntimeConsumer.getMode()
        });
      } else {
        for (let i = 0; i < enabledDependents.length; i++) {
          const depResult = disable(enabledDependents[i], { cascade: true });
          if (depResult.ok) {
            cascadeDisabled.push(enabledDependents[i]);
          }
        }
      }
    }

    // Cleanup
    try {
      if (feature.cleanup) {
        (feature.cleanup as () => void)();
      }

      feature.status = FEATURE_STATUS.DISABLED;
      _metrics.disables++;

      _log('info', 'Feature disabled', {
        featureId,
        cascadeDisabled,
        cascadeSuspended: _shouldSuspendCascade() && enabledDependents.length > 0
      });

      return {
        ok: true,
        featureId,
        cascadeDisabled,
        cascadeSuspended: enabledDependents.length > 0 && cascadeDisabled.length === 0
      };

    } catch (e) {
      feature.status = FEATURE_STATUS.ERROR;
      feature.errorCount = ((feature.errorCount as number) || 0) + 1;
      feature.lastError = (e as Error).message;

      return { ok: false, error: (e as Error).message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // P1: RECOVERY (com backoff exponencial)
  // ─────────────────────────────────────────────────────────────

  function attemptRecovery(featureId: string, options: Record<string, unknown>) {
    options = options || {};
    const feature = _features[featureId];

    if (!feature) {
      return { ok: false, error: `Feature not found: ${featureId}` };
    }

    if (feature.status !== FEATURE_STATUS.ERROR) {
      return { ok: false, error: 'Feature not in ERROR state', currentStatus: feature.status };
    }

    // P0: Verificar se recovery é permitido pelo RuntimeContext
    if (!options.skipGovernanceCheck) {
      const recoveryCheck = _checkRecoveryAllowed(featureId);
      if (!recoveryCheck.allowed) {
        return {
          ok: false,
          error: `Recovery blocked by RuntimeContext: ${recoveryCheck.reason}`,
          blockedByGovernance: true,
          reason: recoveryCheck.reason
        };
      }
    }

    // P1: Verificar backoff/limites de tentativas
    if (!options.skipBackoffCheck) {
      const backoffCheck = _shouldAllowRecoveryAttempt(feature);
      if (!backoffCheck.allowed) {
        return {
          ok: false,
          error: backoffCheck.reason,
          blockedByBackoff: true,
          backoff: backoffCheck.backoff,
          remainingMs: backoffCheck.remainingMs
        };
      }
    }

    // P1: Incrementar contadores de recovery
    feature.recoveryAttempts = ((feature.recoveryAttempts as number) || 0) + 1;
    feature.lastRecoveryAttempt = Date.now();

    // Reset error state and try to enable
    feature.status = FEATURE_STATUS.DISABLED;
    feature.lastError = null;

    _log('info', 'Attempting recovery', {
      featureId,
      attempt: feature.recoveryAttempts,
      isDegraded: RuntimeConsumer.isDegraded()
    });

    const result = enable(featureId, options);

    if (result.ok) {
      feature.totalRecoveries = ((feature.totalRecoveries as number) || 0) + 1;
      _log('info', 'Recovery successful', { featureId, totalRecoveries: feature.totalRecoveries });
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // P1: RESET RECOVERY STATE
  // ─────────────────────────────────────────────────────────────

  function resetRecoveryState(featureId: string) {
    const feature = _features[featureId];
    if (!feature) {
      return { ok: false, error: `Feature not found: ${featureId}` };
    }

    feature.recoveryAttempts = 0;
    feature.lastRecoveryAttempt = null;
    feature.errorCount = 0;
    feature.lastError = null;

    _log('info', 'Recovery state reset', { featureId });
    return { ok: true, featureId };
  }

  function resetAllRecoveryStates() {
    let count = 0;
    for (const id in _features) {
      _features[id].recoveryAttempts = 0;
      _features[id].lastRecoveryAttempt = null;
      count++;
    }
    _log('info', 'All recovery states reset', { count });
    return { ok: true, count };
  }

  // ─────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────

  function get(featureId: string) {
    return _features[featureId] || null;
  }

  function getStatus(featureId: string) {
    const feature = _features[featureId];
    return feature ? feature.status : null;
  }

  function getAll() {
    return Object.assign({}, _features);
  }

  function getByStatus(status: string) {
    const result = [];
    for (const id in _features) {
      if (_features[id].status === status) {
        result.push(id);
      }
    }
    return result;
  }

  function getByPriority(priority: unknown) {
    const result = [];
    for (const id in _features) {
      if (_features[id].priority === priority) {
        result.push(id);
      }
    }
    return result;
  }

  function count() {
    return Object.keys(_features).length;
  }

  function list() {
    const arr = [];
    for (const id in _features) {
      const f = _features[id];
      arr.push({
        id,
        status: f.status,
        priority: f.priority,
        enabled: f.status === FEATURE_STATUS.ENABLED,
        blockCount: f.blockCount || 0,
        lastBlockReason: f.lastBlockReason || null,
        recoveryAttempts: f.recoveryAttempts || 0,
        totalRecoveries: f.totalRecoveries || 0
      });
    }
    return arr;
  }

  // ─────────────────────────────────────────────────────────────
  // P1: FEATURES IN ERROR (para recovery batch)
  // ─────────────────────────────────────────────────────────────

  function getFeaturesInError() {
    const result = [];
    for (const id in _features) {
      const f = _features[id];
      if (f.status === FEATURE_STATUS.ERROR) {
        const backoff = _calculateRecoveryDelay(f);
        result.push({
          id,
          errorCount: f.errorCount,
          lastError: f.lastError,
          recoveryAttempts: f.recoveryAttempts || 0,
          canRetry: backoff.canRetry,
          nextRetryIn: backoff.canRetry ? Math.max(0, backoff.delay - (Date.now() - ((f.lastRecoveryAttempt as number) || 0))) : null
        });
      }
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // HEALTH
  // ─────────────────────────────────────────────────────────────

  function healthCheckAll() {
    const results: Record<string, unknown> = {};
    for (const id in _features) {
      const f = _features[id];
      if (f.healthCheck) {
        try {
          results[id] = (f.healthCheck as () => unknown)();
        } catch (e) {
          results[id] = { status: 'ERROR', error: (e as Error).message };
        }
      } else {
        results[id] = { status: f.status === FEATURE_STATUS.ENABLED ? 'HEALTHY' : f.status };
      }
    }
    return results;
  }

  // ─────────────────────────────────────────────────────────────
  // METRICS
  // ─────────────────────────────────────────────────────────────

  function getMetrics() {
    let enabled = 0, disabled = 0, error = 0;
    for (const id in _features) {
      const s = _features[id].status;
      if (s === FEATURE_STATUS.ENABLED) enabled++;
      else if (s === FEATURE_STATUS.DISABLED) disabled++;
      else if (s === FEATURE_STATUS.ERROR) error++;
    }

    return Object.assign({}, _metrics, {
      total: count(),
      enabled,
      disabled,
      error,
      runtimeMode: RuntimeConsumer.getMode(),
      runtimePhase: RuntimeConsumer.getPhase(),
      canOperate: RuntimeConsumer.canOperate(),
      featuresInError: getFeaturesInError().length
    });
  }

  // ─────────────────────────────────────────────────────────────
  // P0: GOVERNANCE CONTROL
  // ─────────────────────────────────────────────────────────────

  function enableGovernance() {
    _governanceEnabled = true;
    _log('info', 'Governance enabled');
  }

  function disableGovernance() {
    _governanceEnabled = false;
    _log('warn', 'Governance disabled - features will not check RuntimeContext');
  }

  function isGovernanceEnabled() {
    return _governanceEnabled;
  }

  function getGovernanceStatus() {
    return {
      enabled: _governanceEnabled,
      contextAvailable: RuntimeConsumer.hasContext(),
      currentMode: RuntimeConsumer.getMode(),
      currentPhase: RuntimeConsumer.getPhase(),
      canOperate: RuntimeConsumer.canOperate(),
      cascadeSuspended: _shouldSuspendCascade(),
      recoveryConfig: Object.assign({}, _recoveryConfig),
      metrics: {
        blockedByContext: _metrics.blockedByContext,
        blockedByMaintenance: _metrics.blockedByMaintenance,
        blockedByAuth: _metrics.blockedByAuth,
        recoveryBlocked: _metrics.recoveryBlocked,
        cascadesSuspended: _metrics.cascadesSuspended,
        recoveryBackoffs: _metrics.recoveryBackoffs,
        capabilityBlocks: _metrics.capabilityBlocks
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // P1: RECOVERY CONFIG
  // ─────────────────────────────────────────────────────────────

  function setRecoveryConfig(config: Record<string, unknown>) {
    Object.assign(_recoveryConfig, config);
    _log('info', 'Recovery config updated', _recoveryConfig);
    return Object.assign({}, _recoveryConfig);
  }

  function getRecoveryConfig() {
    return Object.assign({}, _recoveryConfig);
  }

  // ─────────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────────

  function reset() {
    _features = {};
    _metrics = {
      registrations: 0, enables: 0, disables: 0, errors: 0,
      blockedByContext: 0, blockedByMaintenance: 0, blockedByAuth: 0, recoveryBlocked: 0,
      cascadesSuspended: 0, recoveryBackoffs: 0, capabilityBlocks: 0
    };
  }

  // ─────────────────────────────────────────────────────────────
  // RETURN API
  // ─────────────────────────────────────────────────────────────

  return {
    // Core operations
    register,
    enable,
    disable,
    // P0/P1: Recovery with governance + backoff
    attemptRecovery,
    // P1: Recovery management
    resetRecoveryState,
    resetAllRecoveryStates,
    getFeaturesInError,
    setRecoveryConfig,
    getRecoveryConfig,
    // Queries
    get,
    getStatus,
    getAll,
    getByStatus,
    getByPriority,
    count,
    list,
    // Health
    healthCheckAll,
    getMetrics,
    // P0: Governance
    enableGovernance,
    disableGovernance,
    isGovernanceEnabled,
    getGovernanceStatus,
    // Reset
    reset
  };
}

// ═══════════════════════════════════════════════════════════════
// MODULE-LEVEL HEALTH & INFO
// ═══════════════════════════════════════════════════════════════

export function healthCheck() {
  const hasRuntimeConsumer = !!RuntimeConsumer;
  const contextAvailable = RuntimeConsumer.hasContext();

  const checks = {
    portsInitialized: { ok: _ModulePorts.isInitialized(), severity: 'info' },
    runtimeConsumerAvailable: { ok: hasRuntimeConsumer, severity: 'crit' },
    contextAvailable: { ok: contextAvailable, severity: 'warn' }
  };

  const passed = Object.values(checks).filter(c => c.ok).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= total - 1 ? 'HEALTHY' : passed >= total - 2 ? 'DEGRADED' : 'UNHEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    score: `${passed}/${total}`,
    checks,
    runtimeMode: contextAvailable ? RuntimeConsumer.getMode() : null,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _ModulePorts.isInitialized(),
    contextAvailable: RuntimeConsumer.hasContext(),
    runtimeMode: RuntimeConsumer.hasContext() ? RuntimeConsumer.getMode() : null,
    recoveryConfig: { ...RECOVERY_CONFIG },
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  createFeatureRegistry,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  RECOVERY_CONFIG
};
