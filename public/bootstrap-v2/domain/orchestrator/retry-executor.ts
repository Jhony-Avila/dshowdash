// Retry Executor - Execução com retry, backoff exponencial e jitter
// @version 3.1.0-RESILIENCE-CONTRACT
// @changelog v3.1.0-RESILIENCE-CONTRACT: Integração com resilience-contract.js
// @changelog v3.0.1-CONTRACTS: Dependency Contract formalizado
// @description #12 Retry com Jitter para evitar thundering herd
// @changelog v3.0.0-ENTERPRISE: #12 Adicionado jitter no backoff
// @changelog v2.2.0-MODULAR: Modularização
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   RESILIENCE_DEFAULTS, RESILIENCE_OUTCOME, createRetryConfig,
//   createResilienceResult, isRetryAppropriate
//   from ../../contracts/resilience-contract.js
//
// RECEIVES (via factory options):
//   options.logger — optional logger instance
//   options.onRetry — optional retry callback
//   options.jitterEnabled — enable jitter (default: true)
//   options.jitterFactor — jitter factor (default: 0.3)
//
// PROVIDES:
//   calculateJitter()         — Calcula jitter para delay
//   calculateBackoffDelay()   — Calcula delay com backoff
//   createRetryExecutor()     — Factory returning: execute(), info()
//
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  RESILIENCE_DEFAULTS,
  RESILIENCE_OUTCOME,
  createRetryConfig,
  createResilienceResult,
  isRetryAppropriate
} from '../../contracts/resilience-contract.js';

const MODULE_ID = 'retry-executor';
const VERSION = '3.1.0-RESILIENCE-CONTRACT';

// ═══════════════════════════════════════════════════════════════
// JITTER CALCULATION
// ═══════════════════════════════════════════════════════════════

// #12: Calcula jitter (variação aleatória)
// jitterFactor: 0.0 = sem jitter, 1.0 = jitter total (0 a 2x delay)
export function calculateJitter(delay: number, jitterFactor?: number) {
  if (jitterFactor === undefined) {
    jitterFactor = RESILIENCE_DEFAULTS.retry.jitterFactor;
  }
  if (jitterFactor <= 0) return delay;
  
  // Gera variação entre -jitterFactor e +jitterFactor
  const variation = (Math.random() * 2 - 1) * jitterFactor;
  const jitteredDelay = delay * (1 + variation);
  
  // Garante delay mínimo de 100ms
  return Math.max(100, Math.round(jitteredDelay));
}

// ═══════════════════════════════════════════════════════════════
// BACKOFF CALCULATION
// ═══════════════════════════════════════════════════════════════

export function calculateBackoffDelay(attempt: number, baseDelay?: number, backoffMultiplier?: number, useJitter?: boolean, jitterFactor?: number) {
  if (baseDelay === undefined) {
    baseDelay = RESILIENCE_DEFAULTS.retry.baseDelay;
  }
  if (backoffMultiplier === undefined) {
    backoffMultiplier = RESILIENCE_DEFAULTS.retry.backoffMultiplier;
  }
  if (useJitter === undefined) {
    useJitter = RESILIENCE_DEFAULTS.retry.jitterEnabled;
  }
  if (jitterFactor === undefined) {
    jitterFactor = RESILIENCE_DEFAULTS.retry.jitterFactor;
  }
  
  let delay = Math.round(baseDelay * Math.pow(backoffMultiplier, attempt - 1));
  
  // Enforce max delay from contract
  if (delay > RESILIENCE_DEFAULTS.retry.maxDelay) {
    delay = RESILIENCE_DEFAULTS.retry.maxDelay;
  }
  
  // #12: Aplicar jitter se habilitado
  if (useJitter) {
    delay = calculateJitter(delay, jitterFactor);
  }
  
  return delay;
}

// ═══════════════════════════════════════════════════════════════
// RETRY EXECUTOR FACTORY
// ═══════════════════════════════════════════════════════════════

interface RetryExecutorOptions {
  logger?: Record<string, Function> | null;
  onRetry?: (info: Record<string, unknown>) => void;
  jitterEnabled?: boolean;
  jitterFactor?: number;
}

interface RetryConfig {
  enabled?: boolean;
  maxAttempts?: number;
  baseDelay?: number;
  backoffMultiplier?: number;
  jitterEnabled?: boolean;
  jitterFactor?: number;
  returnResilienceResult?: boolean;
  [key: string]: unknown;
}

export function createRetryExecutor(options: RetryExecutorOptions) {
  if (options === undefined) options = {};
  const logger = options.logger;
  const onRetry = options.onRetry;
  
  // #12: Configuração de jitter (usa defaults do contrato)
  const defaultJitterEnabled = options.jitterEnabled !== undefined 
    ? options.jitterEnabled 
    : RESILIENCE_DEFAULTS.retry.jitterEnabled;
  const defaultJitterFactor = options.jitterFactor || RESILIENCE_DEFAULTS.retry.jitterFactor;

  // Estatísticas de execução
  let _stats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalRetries: 0,
    successAfterRetry: 0
  };

  function log(level: string, message: string, data?: Record<string, unknown>) {
    if (logger && logger[level]) {
      logger[level](message, data);
    }
  }

  return {
    /**
     * execute — Executa função com retry
     * @param {Function} fn - Função a executar
     * @param {Object} retryConfig - Configuração de retry
     * @param {string} contextId - ID do contexto (ex: phaseId)
     * @returns {Promise} - Resultado da execução
     */
    execute: function(fn: () => Promise<unknown>, retryConfig: RetryConfig, contextId: string) {
      // Normalizar config usando o contrato
      const config = createRetryConfig(retryConfig);
      
      const maxAttempts = config.maxAttempts;
      const baseDelay = config.baseDelay;
      const backoff = config.backoffMultiplier;
      let attempt = 0;
      const startTime = Date.now();
      
      // Jitter configurável por retry ou usa default
      const useJitter = config.jitterEnabled;
      const jitterFactor = config.jitterFactor;

      _stats.totalExecutions++;

      function tryExecute(): Promise<unknown> {
        attempt++;
        return Promise.resolve().then(function() {
          return fn();
        }).then(function(result) {
          // Sucesso
          const duration = Date.now() - startTime;
          _stats.successfulExecutions++;
          
          if (attempt > 1) {
            _stats.successAfterRetry++;
          }

          // v3.1.0: Retornar resultado padronizado se solicitado
          if (retryConfig && retryConfig.returnResilienceResult) {
            return createResilienceResult({
              outcome: attempt > 1 ? RESILIENCE_OUTCOME.SUCCESS_AFTER_RETRY : RESILIENCE_OUTCOME.SUCCESS,
              phaseId: contextId,
              attempt: attempt,
              duration: duration,
              details: { result: result }
            });
          }

          return result;
        }).catch(function(error) {
          const canRetry = attempt < maxAttempts && config.enabled;
          
          // v3.1.0: Verificar política de retry
          const errorType = error.type || error.code || 'unknown';
          const policyAllows = isRetryAppropriate(errorType, {
            phaseId: contextId,
            attempt: attempt,
            maxAttempts: maxAttempts
          });

          if (canRetry && policyAllows !== false) {
            const delay = calculateBackoffDelay(attempt, baseDelay, backoff, useJitter, jitterFactor);
            
            _stats.totalRetries++;
            
            onRetry && onRetry({ 
              attempt: attempt, 
              maxAttempts: maxAttempts, 
              delay: delay, 
              contextId: contextId,
              jitterApplied: useJitter,
              errorType: errorType
            });
            
            log('warn', 'Attempt ' + attempt + ' failed for ' + contextId + ', retrying in ' + delay + 'ms', {
              error: error.message,
              attempt: attempt,
              maxAttempts: maxAttempts,
              nextDelay: delay,
              jitterApplied: useJitter,
              jitterFactor: jitterFactor,
              errorType: errorType
            });

            return new Promise(function(resolve) {
              setTimeout(resolve, delay);
            }).then(tryExecute);
          }

          // Falha final
          _stats.failedExecutions++;
          
          // v3.1.0: Retornar resultado padronizado se solicitado
          if (retryConfig && retryConfig.returnResilienceResult) {
            return Promise.reject(createResilienceResult({
              outcome: RESILIENCE_OUTCOME.RETRY_EXHAUSTED,
              phaseId: contextId,
              attempt: attempt,
              duration: Date.now() - startTime,
              error: error,
              details: { 
                maxAttempts: maxAttempts,
                errorType: errorType,
                policyAllowed: policyAllows
              }
            }));
          }

          throw error;
        });
      }

      return tryExecute();
    },
    
    /**
     * getStats — Retorna estatísticas de execução
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
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalRetries: 0,
        successAfterRetry: 0
      };
    },
    
    /**
     * info — Informações do executor
     * @returns {Object}
     */
    info: function() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        jitterEnabled: defaultJitterEnabled,
        jitterFactor: defaultJitterFactor,
        defaults: {
          maxAttempts: RESILIENCE_DEFAULTS.retry.maxAttempts,
          baseDelay: RESILIENCE_DEFAULTS.retry.baseDelay,
          backoffMultiplier: RESILIENCE_DEFAULTS.retry.backoffMultiplier,
          maxDelay: RESILIENCE_DEFAULTS.retry.maxDelay
        },
        stats: Object.assign({}, _stats),
        contractVersion: '1.0.0',
        improvements: ['#12-RetryWithJitter', 'RESILIENCE-CONTRACT']
      };
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { MODULE_ID, VERSION };

export default { 
  calculateJitter, 
  calculateBackoffDelay, 
  createRetryExecutor,
  MODULE_ID,
  VERSION
};
