// Degradation Handler - Políticas de degradação
// @version 2.4.0-DEGRADATION-CONTRACT
// @changelog v2.4.0-DEGRADATION-CONTRACT - Integração com degradation-contract.js, retorna resultado padronizado
// @changelog v2.3.0-DOMAIN-PURE - Removido import de auth-detector.js (código morto). isAuthenticated via _resolveAuth() cadeia AAA
// @changelog v2.2.0-MODULAR - Versão modular inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES via options:
//   options.logger         — Logger instance
//   options.moduleId       — Module ID string
//   options.metricsSummary — Metrics summary instance
//   options.bootContext    — Boot context instance
//
// IMPORTS:
//   createDegradationResult, mapModeToStatus, getSeverityForMode,
//   isRecoverableMode, DEGRADATION_MODES from contracts/degradation-contract.js
//
// RESOLVES auth via chain:
//   1. window.RuntimeContext.isAuthenticated() — fonte única de verdade
//   2. document.body.dataset.state             — DOM fallback
//
// PROVIDES:
//   createDegradationHandler() factory returning:
//     applyPolicy(phaseId, manifestConfig) — Aplica política e retorna DegradationResult
//     shouldSuppressError(phaseId, manifestConfig) — Verifica se erro deve ser suprimido
//     isAuthenticated() — Verifica autenticação
//     getAppliedPolicies() — Retorna políticas aplicadas
//     info() — Informações do handler
//
// WINDOW ACCESS:
//   window.RuntimeContext.isAuthenticated() — fonte de verdade para auth
//   document.body.dataset.state — fallback DOM
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  createDegradationResult,
  mapModeToStatus,
  getSeverityForMode,
  isRecoverableMode,
  DEGRADATION_MODES
} from '../../contracts/degradation-contract.js';

const MODULE_ID = 'degradation-handler';
const VERSION = '2.4.0-DEGRADATION-CONTRACT';

// v2.3.0: Resolver autenticação via cadeia AAA (sem dependência de auth-detector)
function _resolveAuth() {
  if (typeof window !== 'undefined') {
    // 1. RuntimeContext — fonte única de verdade
    if (window.RuntimeContext && window.RuntimeContext.isAuthenticated) {
      try {
        return window.RuntimeContext.isAuthenticated();
      } catch (e) { /* fallback */ }
    }
    // 2. DOM state — fallback
    if (typeof document !== 'undefined' && document.body && document.body.dataset) {
      return document.body.dataset.state === 'authenticated';
    }
  }
  return false;
}

interface DegradationPolicy {
  [key: string]: unknown;
}

interface DegradationHandlerOptions {
  logger?: Record<string, Function> | null;
  moduleId?: string;
  metricsSummary?: { recordDegradation: (phaseId: string, message: string) => void } | null;
  bootContext?: Record<string, unknown> | null;
}

interface ManifestConfig {
  onFail?: { mode: string; message?: string };
  suppressWhenUnauth?: boolean;
  [key: string]: unknown;
}

export function createDegradationHandler(options: DegradationHandlerOptions) {
  if (options === undefined) options = {};
  const logger = options.logger;
  const handlerModuleId = options.moduleId || MODULE_ID;
  const metricsSummary = options.metricsSummary;
  const bootContext = options.bootContext;

  // v2.4.0: Registro de políticas aplicadas
  const _appliedPolicies: DegradationPolicy[] = [];

  function log(level: string, message: string, data?: Record<string, unknown>) {
    if (logger && logger[level]) {
      logger[level](message, Object.assign({}, data, { module: handlerModuleId }));
    }
  }

  return {
    /**
     * applyPolicy — Aplica política de degradação e retorna resultado padronizado
     * @param {string} phaseId - ID da fase
     * @param {object} manifestConfig - Configuração do manifest para a fase
     * @returns {object|null} - DegradationResult ou null se sem política
     */
    applyPolicy: function(phaseId: string, manifestConfig: ManifestConfig) {
      if (!manifestConfig || !manifestConfig.onFail) return null;
      
      const policy = manifestConfig.onFail;
      const mode = policy.mode;
      
      log('info', 'Applying degradation policy for ' + phaseId, { 
        mode: mode, 
        message: policy.message 
      });
      
      // Criar resultado padronizado usando o contrato
      const result = createDegradationResult({
        mode: mode,
        phaseId: phaseId,
        reason: policy.message || 'Phase degraded',
        details: {
          suppressWhenUnauth: manifestConfig.suppressWhenUnauth || false,
          originalPolicy: policy
        }
      });

      // Registrar política aplicada
      _appliedPolicies.push(result);
      
      // Registrar no metricsSummary se disponível
      if (metricsSummary && metricsSummary.recordDegradation) {
        metricsSummary.recordDegradation(phaseId, policy.message || 'Phase degraded');
      }
      
      // Registrar no bootContext se disponível
      if (bootContext) {
        log('info', 'Degradation registered in BootContext', { 
          phase: phaseId,
          status: result.status,
          severity: result.severity,
          recoverable: result.recoverable
        });
      }

      // Marcar como notificado
      result.notified = true;

      return result;
    },

    /**
     * shouldSuppressError — Verifica se erro deve ser suprimido
     * @param {string} phaseId - ID da fase
     * @param {object} manifestConfig - Configuração do manifest
     * @returns {boolean}
     */
    shouldSuppressError: function(phaseId: string, manifestConfig: ManifestConfig) {
      // Supprime se configurado e não autenticado
      if (manifestConfig && manifestConfig.suppressWhenUnauth && !_resolveAuth()) {
        return true;
      }
      
      // Supprime phase-3-shell se não autenticado
      if (phaseId === 'phase-3-shell' && !_resolveAuth()) {
        return true;
      }
      
      return false;
    },

    /**
     * isAuthenticated — Expõe verificação de autenticação
     * @returns {boolean}
     */
    isAuthenticated: _resolveAuth,

    /**
     * getAppliedPolicies — Retorna todas as políticas aplicadas
     * @returns {array}
     */
    getAppliedPolicies: function() {
      return _appliedPolicies.slice();
    },

    /**
     * getAppliedPoliciesCount — Retorna contagem de políticas por status
     * @returns {object}
     */
    getAppliedPoliciesCount: function() {
      const counts: {
        total: number;
        byStatus: Record<string, number>;
        bySeverity: Record<string, number>;
        recoverable: number;
        nonRecoverable: number;
      } = {
        total: _appliedPolicies.length,
        byStatus: {},
        bySeverity: {},
        recoverable: 0,
        nonRecoverable: 0
      };

      for (let i = 0; i < _appliedPolicies.length; i++) {
        const p = _appliedPolicies[i];
        
        // Por status
        const status = p.status as string;
        counts.byStatus[status] = (counts.byStatus[status] || 0) + 1;

        // Por severidade
        const severity = p.severity as string;
        counts.bySeverity[severity] = (counts.bySeverity[severity] || 0) + 1;
        
        // Recuperáveis
        if (p.recoverable) {
          counts.recoverable++;
        } else {
          counts.nonRecoverable++;
        }
      }

      return counts;
    },

    /**
     * reset — Limpa políticas aplicadas (para testes/reset)
     */
    reset: function() {
      _appliedPolicies.length = 0;
      log('info', 'Degradation handler reset');
    },

    /**
     * info — Informações do handler
     * @returns {object}
     */
    info: function() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        handlerModuleId: handlerModuleId,
        appliedPoliciesCount: _appliedPolicies.length,
        policiesSummary: this.getAppliedPoliciesCount(),
        isAuthenticated: _resolveAuth(),
        contractVersion: '1.0.0',
        features: [
          'DEGRADATION-CONTRACT',
          'standardized-results',
          'policy-tracking',
          'auth-chain-AAA'
        ]
      };
    }
  };
}

export { MODULE_ID, VERSION, DEGRADATION_MODES };

export default { 
  createDegradationHandler,
  MODULE_ID,
  VERSION
};
