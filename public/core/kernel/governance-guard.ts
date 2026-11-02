// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.governance-guard
// PURPOSE: Guard de Governança para Componentes
// ───────────────────────────────────────────────────────────────
// @contract KERNEL_INTERNAL - Módulo interno do kernel
// @contract GOVERNANCE - Verifica RuntimeContext antes de permitir operações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RuntimeConsumer from ./runtime-consumer.js
//   TelemetryEmitter from ./telemetry-emitter.js
//   HealthAggregator from ./health-aggregator.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   canInit(componentId, options) — verifica se componente pode inicializar
//   guardedInit(componentId, fn, options) — wrapper de execução governada
//   canPerformHeavyOperation(componentId) — verifica operações pesadas
//   reportHealth(componentId, status, score, details) — reporta health
//   onContextChange(callback) — subscribe a mudanças de contexto
//   getContextSnapshot() — snapshot atual do contexto
//   hasContext() — verifica se contexto está disponível
//   healthCheck() — status de saúde do módulo
//   info() — informações do módulo
//
// @changelog v1.1.0-P2-ENTERPRISE: Added healthCheck, improved DEPENDENCY CONTRACT
// @changelog v1.0.0-P2: Initial governance guard implementation
// ═══════════════════════════════════════════════════════════════
'use strict';

import RuntimeConsumer from './runtime-consumer.js';
import TelemetryEmitter from './telemetry-emitter.js';
import HealthAggregator from './health-aggregator.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.governance-guard';

// Metrics
const _metrics: {
  canInitCalls: number;
  guardedInitCalls: number;
  blockedOperations: number;
  allowedOperations: number;
  heavyOperationChecks: number;
  lastCheckAt: number | null;
} = {
  canInitCalls: 0,
  guardedInitCalls: 0,
  blockedOperations: 0,
  allowedOperations: 0,
  heavyOperationChecks: 0,
  lastCheckAt: null
};

// ═══════════════════════════════════════════════════════════════
// GUARD FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica se um componente pode inicializar
 * @param {string} componentId - ID do componente
 * @param {object} options - Opções de verificação
 * @returns {object} { allowed: boolean, reason?: string, deferred?: boolean }
 */
export function canInit(componentId: string, options: Record<string, unknown>) {
  options = options || {};
  _metrics.canInitCalls++;
  _metrics.lastCheckAt = Date.now();

  // Se não tiver contexto ainda, permitir (bootstrap ainda não completou)
  if (!RuntimeConsumer.hasContext()) {
    _metrics.allowedOperations++;
    return { allowed: true, reason: 'No context yet (early boot)', earlyBoot: true };
  }

  // Verificar se sistema permite operação
  if (!RuntimeConsumer.canOperate()) {
    const mode = RuntimeConsumer.getMode();
    const phase = RuntimeConsumer.getPhase();

    _metrics.blockedOperations++;
    TelemetryEmitter.governanceBlock(componentId, 'System not ready', mode);

    return {
      allowed: false,
      reason: 'System not ready for operations',
      mode,
      phase,
      deferred: true
    };
  }

  // Verificar requisitos específicos
  if (options.requiresAuth) {
    const authCheck = RuntimeConsumer.canEnableFeature({ requiresAuth: true }) as { allowed: boolean; reason?: string };
    if (!authCheck.allowed) {
      _metrics.blockedOperations++;
      TelemetryEmitter.governanceBlock(componentId, 'Auth required', RuntimeConsumer.getMode());
      return {
        allowed: false,
        reason: authCheck.reason || 'Authentication required',
        deferred: true
      };
    }
  }

  if (options.requiresCapability) {
    if (!RuntimeConsumer.isCapabilityEnabled(options.requiresCapability as string)) {
      _metrics.blockedOperations++;
      TelemetryEmitter.governanceBlock(componentId, `Capability missing: ${options.requiresCapability}`, RuntimeConsumer.getMode());
      return {
        allowed: false,
        reason: `Required capability not available: ${options.requiresCapability}`,
        deferred: true
      };
    }
  }

  if (options.minLevel) {
    const authLevel = RuntimeConsumer.getAuthLevel ? RuntimeConsumer.getAuthLevel() : 0;
    if (authLevel < (options.minLevel as number)) {
      _metrics.blockedOperations++;
      return {
        allowed: false,
        reason: `Insufficient auth level. Required: ${options.minLevel}, Current: ${authLevel}`,
        deferred: false
      };
    }
  }

  _metrics.allowedOperations++;
  return { allowed: true };
}

/**
 * Wrapper que executa uma função apenas se governança permitir
 * @param {string} componentId - ID do componente
 * @param {function} fn - Função a executar
 * @param {object} options - Opções de verificação
 * @returns {Promise} Resultado da execução ou erro de governança
 */
export function guardedInit(componentId: string, fn: (...args: unknown[]) => unknown, options: Record<string, unknown>) {
  options = options || {};
  _metrics.guardedInitCalls++;

  const check = canInit(componentId, options);

  if (!check.allowed) {
    if (check.deferred && options.onDeferred) {
      // Subscrever para tentar novamente quando contexto mudar
      // @ts-expect-error strict migration — TS2345
      const unsub = RuntimeConsumer.subscribe('context:changed', (snapshot: { ready: boolean; maintenance: boolean; [key: string]: unknown }) => {
        if (snapshot.ready && !snapshot.maintenance) {
          unsub();
          guardedInit(componentId, fn, Object.assign({}, options, { onDeferred: null }));
        }
      });

      if (typeof options.onDeferred === 'function') {
        options.onDeferred(check);
      }
    }

    return Promise.resolve({
      ok: false,
      blocked: true,
      reason: check.reason,
      mode: check.mode,
      phase: check.phase,
      deferred: check.deferred
    });
  }

  // Executar função
  const startTime = Date.now();

  return Promise.resolve().then(() => fn()).then(result => {
    const duration = Date.now() - startTime;

    // Reportar health
    HealthAggregator.report(componentId, 'core', 'HEALTHY', { score: 100, initDuration: duration });

    // Emitir telemetria
    TelemetryEmitter.featureEnabled(componentId, duration);

    return result;
  }).catch(error => {
    // Reportar health de erro
    HealthAggregator.report(componentId, 'core', 'UNHEALTHY', { score: 0, error: error.message });

    // Emitir telemetria de erro
    TelemetryEmitter.featureError(componentId, error.message);

    throw error;
  });
}

/**
 * Verifica se pode executar operação pesada
 * @param {string} componentId - ID do componente
 * @returns {object}
 */
export function canPerformHeavyOperation(componentId: string) {
  _metrics.heavyOperationChecks++;
  _metrics.lastCheckAt = Date.now();

  if (!RuntimeConsumer.hasContext()) {
    return { allowed: true, earlyBoot: true };
  }

  if (!RuntimeConsumer.canPerformHeavyOperations()) {
    _metrics.blockedOperations++;
    return {
      allowed: false,
      reason: 'System in degraded state, heavy operations blocked',
      mode: RuntimeConsumer.getMode()
    };
  }

  _metrics.allowedOperations++;
  return { allowed: true };
}

/**
 * Reporta health de um componente
 * @param {string} componentId - ID do componente
 * @param {string} status - Status (HEALTHY, DEGRADED, UNHEALTHY)
 * @param {number} score - Score 0-100
 * @param {object} details - Detalhes adicionais
 * @returns {object}
 */
export function reportHealth(componentId: string, status: string, score: number, details: unknown) {
  return HealthAggregator.report(componentId, 'core', status, { score, ...(details as Record<string, unknown> || {}) });
}

/**
 * Wrapper para subscrever a mudanças de contexto
 * @param {function} callback - Callback para mudanças
 * @returns {function} Unsubscribe function
 */
export function onContextChange(callback: (...args: unknown[]) => unknown) {
  return RuntimeConsumer.subscribe('context:changed', callback);
}

/**
 * Obtém snapshot atual do contexto
 * @returns {object}
 */
export function getContextSnapshot() {
  return RuntimeConsumer.getSnapshot();
}

/**
 * Verifica se contexto está disponível
 * @returns {boolean}
 */
export function hasContext() {
  return RuntimeConsumer.hasContext();
}

/**
 * Health check do módulo
 * @returns {object}
 */
export function healthCheck() {
  const hasCtx = RuntimeConsumer.hasContext();
  const canOp = hasCtx ? RuntimeConsumer.canOperate() : null;
  const totalOperations = _metrics.allowedOperations + _metrics.blockedOperations;
  const blockRate = totalOperations > 0
    ? (_metrics.blockedOperations / totalOperations) * 100
    : 0;

  const checks = {
    hasContext: { ok: hasCtx, severity: 'info' },
    canOperate: { ok: canOp !== false, severity: 'warn' },
    lowBlockRate: { ok: blockRate < 50, severity: 'warn' },
    runtimeConsumerAvailable: { ok: !!RuntimeConsumer, severity: 'crit' },
    healthAggregatorAvailable: { ok: !!HealthAggregator, severity: 'warn' }
  };

  const passed = Object.values(checks).filter(c => c.ok).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= total - 1 ? 'HEALTHY' : passed >= total - 2 ? 'DEGRADED' : 'UNHEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    score: `${passed}/${total}`,
    checks,
    metrics: { ..._metrics },
    blockRate: `${Math.round(blockRate)}%`,
    timestamp: Date.now()
  };
}

/**
 * Info do módulo
 * @returns {object}
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasContext: RuntimeConsumer.hasContext(),
    canOperate: RuntimeConsumer.hasContext() ? RuntimeConsumer.canOperate() : null,
    mode: RuntimeConsumer.hasContext() ? RuntimeConsumer.getMode() : null,
    phase: RuntimeConsumer.hasContext() ? RuntimeConsumer.getPhase() : null,
    metrics: { ..._metrics },
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  canInit,
  guardedInit,
  canPerformHeavyOperation,
  reportHealth,
  onContextChange,
  getContextSnapshot,
  hasContext,
  healthCheck,
  info
};
