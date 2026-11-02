// Global Timeout Manager
// @version 2.7.0-RESILIENCE-CONTRACT
// @changelog v2.7.0-RESILIENCE-CONTRACT: Integração com resilience-contract.js
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.7.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   GLOBAL_TIMEOUT_CONFIG from ../configs/index.js
//   RESILIENCE_DEFAULTS, RESILIENCE_OUTCOME, createTimeoutConfig,
//   createResilienceResult from ../../contracts/resilience-contract.js
//
// RECEIVES (via createGlobalTimeout options):
//   options.onTimeout     — Callback for timeout event
//   options.onWarning     — Callback for warning event
//   options.loggerAdapter — Logger for status messages
//   options.config        — Override config (optional)
//
// PROVIDES:
//   createGlobalTimeout() factory returning:
//     start(), clear(), getStatus(), getElapsed(), info()
//
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { GLOBAL_TIMEOUT_CONFIG } from '../configs/index.js';
import {
  RESILIENCE_DEFAULTS,
  RESILIENCE_OUTCOME,
  createTimeoutConfig,
  createResilienceResult
} from '../../contracts/resilience-contract.js';

const MODULE_ID = 'timeout-manager';
const VERSION = '2.7.0-RESILIENCE-CONTRACT';

// ═══════════════════════════════════════════════════════════════
// GLOBAL TIMEOUT FACTORY
// ═══════════════════════════════════════════════════════════════

interface TimeoutOptions {
  onTimeout?: (result: Record<string, unknown>) => void;
  onWarning?: (result: Record<string, unknown>) => void;
  loggerAdapter?: Record<string, Function> | null;
  config?: { timeoutMs?: number; warningMs?: number; enabled?: boolean };
}

export function createGlobalTimeout(options: TimeoutOptions) {
  if (!options) options = {};

  const onTimeout = options.onTimeout;
  const onWarning = options.onWarning;
  const loggerAdapter = options.loggerAdapter;
  
  // v2.7.0: Merge config com defaults do contrato
  const baseConfig = options.config || GLOBAL_TIMEOUT_CONFIG;
  const config = createTimeoutConfig({
    timeout: baseConfig.timeoutMs || RESILIENCE_DEFAULTS.timeout.global,
    warning: baseConfig.warningMs || RESILIENCE_DEFAULTS.timeout.warning,
    enabled: baseConfig.enabled !== undefined ? baseConfig.enabled : true
  });
  
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let warningId: ReturnType<typeof setTimeout> | null = null;
  let startTime: number | null = null;
  let aborted = false;
  let warningFired = false;
  let timeoutFired = false;

  // Estatísticas
  let _stats = {
    starts: 0,
    clears: 0,
    warnings: 0,
    timeouts: 0,
    totalElapsed: 0
  };

  function log(level: string, message: string, data?: Record<string, unknown>) {
    if (loggerAdapter && loggerAdapter[level]) {
      loggerAdapter[level](message, data);
    }
  }

  return {
    /**
     * start — Inicia o timeout global
     */
    start: function() {
      if (!config.enabled) {
        log('info', 'Global timeout disabled, not starting');
        return;
      }

      // Limpar qualquer timeout anterior
      this.clear('restart');
      
      startTime = Date.now();
      aborted = false;
      warningFired = false;
      timeoutFired = false;
      _stats.starts++;
      
      // Warning timeout
      if (config.warningMs < config.timeoutMs) {
        warningId = setTimeout(function() {
          if (!aborted && onWarning) {
            warningFired = true;
            _stats.warnings++;
            const elapsed = Date.now() - startTime!;
            
            // v2.7.0: Usar resultado padronizado
            const warningResult = createResilienceResult({
              outcome: RESILIENCE_OUTCOME.DEGRADED,
              duration: elapsed,
              details: {
                type: 'warning',
                elapsed: elapsed,
                remaining: config.timeoutMs - elapsed,
                message: 'Boot is taking longer than expected'
              }
            });

            onWarning(warningResult);
          }
        }, config.warningMs);
      }
      
      // Main timeout
      timeoutId = setTimeout(function() {
        if (!aborted && onTimeout) {
          timeoutFired = true;
          _stats.timeouts++;
          const elapsed = Date.now() - startTime!;
          _stats.totalElapsed += elapsed;

          // v2.7.0: Usar resultado padronizado
          const timeoutResult = createResilienceResult({
            outcome: RESILIENCE_OUTCOME.TIMEOUT_EXCEEDED,
            duration: elapsed,
            details: {
              type: 'timeout',
              elapsed: elapsed,
              timeoutMs: config.timeoutMs,
              message: 'Boot exceeded global timeout'
            }
          });

          onTimeout(timeoutResult);
        }
      }, config.timeoutMs);
      
      log('info', 'Global timeout started', {
        timeoutMs: config.timeoutMs,
        warningMs: config.warningMs
      });
    },
    
    /**
     * clear — Limpa o timeout (boot completou ou foi cancelado)
     * @param {string} reason — Motivo do clear
     */
    clear: function(reason: string) {
      const wasRunning = !!timeoutId;
      const elapsed = startTime ? Date.now() - startTime : 0;

      aborted = true;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (warningId) {
        clearTimeout(warningId);
        warningId = null;
      }
      
      if (wasRunning) {
        _stats.clears++;
        _stats.totalElapsed += elapsed;

        log('info', 'Global timeout cleared', {
          reason: reason,
          elapsed: elapsed,
          warningFired: warningFired,
          timeoutFired: timeoutFired
        });
      }

      // Reset state
      startTime = null;
      warningFired = false;
      timeoutFired = false;
    },
    
    /**
     * getStatus — Retorna status atual do timeout
     * @returns {Object}
     */
    getStatus: function() {
      return {
        enabled: config.enabled,
        running: !!timeoutId,
        elapsed: startTime ? Date.now() - startTime : 0,
        timeoutMs: config.timeoutMs,
        warningMs: config.warningMs,
        warningFired: warningFired,
        timeoutFired: timeoutFired,
        aborted: aborted
      };
    },

    /**
     * getElapsed — Retorna tempo decorrido
     * @returns {number}
     */
    getElapsed: function() {
      return startTime ? Date.now() - startTime : 0;
    },

    /**
     * getRemainingTime — Retorna tempo restante até timeout
     * @returns {number}
     */
    getRemainingTime: function() {
      if (!startTime || aborted) return 0;
      const remaining = config.timeoutMs - (Date.now() - startTime);
      return remaining > 0 ? remaining : 0;
    },

    /**
     * getStats — Retorna estatísticas
     * @returns {Object}
     */
    getStats: function() {
      return Object.assign({}, _stats);
    },

    /**
     * resetStats — Reseta estatísticas
     */
    resetStats: function() {
      _stats = {
        starts: 0,
        clears: 0,
        warnings: 0,
        timeouts: 0,
        totalElapsed: 0
      };
    },

    /**
     * info — Informações do manager
     * @returns {Object}
     */
    info: function() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        config: {
          enabled: config.enabled,
          timeoutMs: config.timeoutMs,
          warningMs: config.warningMs
        },
        defaults: {
          global: RESILIENCE_DEFAULTS.timeout.global,
          warning: RESILIENCE_DEFAULTS.timeout.warning,
          minimum: RESILIENCE_DEFAULTS.timeout.minimum,
          maximum: RESILIENCE_DEFAULTS.timeout.maximum
        },
        status: this.getStatus(),
        stats: Object.assign({}, _stats),
        contractVersion: '1.0.0'
      };
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { MODULE_ID, VERSION };

export default { 
  createGlobalTimeout,
  MODULE_ID,
  VERSION
};
