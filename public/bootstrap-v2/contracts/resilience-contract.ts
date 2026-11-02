
// Resilience Contract — Contrato Formal de Políticas de Resiliência
// @version 1.0.0
// @description Centraliza políticas de retry, timeout, backoff e circuit breaker
// @changelog v1.0.0: Criação do contrato formal de resiliência
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained, defines policies)
// PROVIDES:
//   RETRY_POLICY              — Quando retry é permitido/proibido
//   TIMEOUT_POLICY            — Quando timeout é significativo
//   RESILIENCE_LEVEL          — Níveis de resiliência
//   RESILIENCE_OUTCOME        — Resultados possíveis
//   RESILIENCE_DEFAULTS       — Configurações padrão centralizadas
//   createRetryConfig()       — Factory para config de retry
//   createTimeoutConfig()     — Factory para config de timeout
//   createResilienceResult()  — Factory para resultado padronizado
//   validateResilienceResult() — Validador de conformidade
//   isRetryAppropriate()      — Verifica se retry é apropriado
//   isTimeoutMeaningful()     — Verifica se timeout é significativo
//   determineResilienceLevel() — Determina nível apropriado
//   info()                    — Informações do módulo
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'resilience-contract';
const VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// RETRY_POLICY — Define quando retry é apropriado
// ═══════════════════════════════════════════════════════════════
// Regra fundamental: "Retry protege contra falhas TRANSITÓRIAS.
// Não deve mascarar erros estruturais."

export const RETRY_POLICY = Object.freeze({
  // Situações onde retry É PERMITIDO
  ALLOWED_FOR: Object.freeze([
    'external-api-call',        // Chamadas a APIs externas
    'network-request',          // Requisições de rede
    'transient-failure',        // Falhas transitórias conhecidas
    'dependency-unavailable',   // Dependência temporariamente indisponível
    'timeout-exceeded',         // Timeout que pode ser transitório
    'rate-limited',             // Rate limiting temporário
    'service-overloaded'        // Serviço temporariamente sobrecarregado
  ]),

  // Situações onde retry É PROIBIDO
  FORBIDDEN_FOR: Object.freeze([
    'internal-logic-error',     // Erros de lógica interna
    'validation-failure',       // Falhas de validação
    'auth-failure',             // Falhas de autenticação
    'permission-denied',        // Permissão negada
    'configuration-error',      // Erros de configuração
    'critical-phase-error',     // Erros em fases críticas (phase-0)
    'data-corruption',          // Dados corrompidos
    'contract-violation',       // Violação de contrato
    'missing-dependency',       // Dependência ausente (não transitório)
    'boot-loop-detected'        // Loop de boot detectado
  ])
});

// ═══════════════════════════════════════════════════════════════
// TIMEOUT_POLICY — Define quando timeout é significativo
// ═══════════════════════════════════════════════════════════════
// Regra fundamental: "Timeout protege contra espera infinita.
// Não deve ser usado para decidir fluxo de negócio."

export const TIMEOUT_POLICY = Object.freeze({
  // Situações onde timeout É SIGNIFICATIVO
  MEANINGFUL_FOR: Object.freeze([
    'external-dependency',      // Dependências externas
    'network-operation',        // Operações de rede
    'async-initialization',     // Inicializações assíncronas
    'resource-acquisition',     // Aquisição de recursos
    'third-party-service',      // Serviços de terceiros
    'database-query',           // Queries de banco
    'file-operation'            // Operações de arquivo
  ]),

  // Situações onde timeout NÃO É SIGNIFICATIVO
  NOT_MEANINGFUL_FOR: Object.freeze([
    'sync-operation',           // Operações síncronas
    'internal-calculation',     // Cálculos internos
    'state-transition',         // Transições de estado
    'event-emission',           // Emissão de eventos
    'memory-operation',         // Operações em memória
    'local-validation'          // Validações locais
  ])
});

// ═══════════════════════════════════════════════════════════════
// RESILIENCE_LEVEL — Níveis de resiliência disponíveis
// ═══════════════════════════════════════════════════════════════

export const RESILIENCE_LEVEL = Object.freeze({
  NONE: 'none',               // Sem resiliência — falha imediata
  MINIMAL: 'minimal',         // Apenas timeout, sem retry
  STANDARD: 'standard',       // Timeout + 1-2 retries
  AGGRESSIVE: 'aggressive',   // Timeout + múltiplos retries + backoff + jitter
  CRITICAL: 'critical'        // Para fases críticas — sem retry, falha rápida
});

// ═══════════════════════════════════════════════════════════════
// RESILIENCE_OUTCOME — Resultados possíveis de operação resiliente
// ═══════════════════════════════════════════════════════════════

export const RESILIENCE_OUTCOME = Object.freeze({
  SUCCESS: 'success',                     // Operação bem-sucedida
  SUCCESS_AFTER_RETRY: 'success-after-retry', // Sucesso após retry
  RETRY_EXHAUSTED: 'retry-exhausted',     // Todas tentativas falharam
  TIMEOUT_EXCEEDED: 'timeout-exceeded',   // Timeout excedido
  CIRCUIT_OPEN: 'circuit-open',           // Circuit breaker aberto
  BOOT_LOOP_DETECTED: 'boot-loop-detected', // Loop de boot detectado
  POLICY_VIOLATION: 'policy-violation',   // Violação de política
  SKIPPED: 'skipped',                     // Operação pulada
  DEGRADED: 'degraded'                    // Completou em modo degradado
});

// ═══════════════════════════════════════════════════════════════
// RESILIENCE_DEFAULTS — Configurações padrão centralizadas (SSOT)
// ═══════════════════════════════════════════════════════════════

export const RESILIENCE_DEFAULTS = Object.freeze({
  retry: Object.freeze({
    enabled: true,
    maxAttempts: 2,
    baseDelay: 1000,
    backoffMultiplier: 1.5,
    maxDelay: 30000,
    jitterEnabled: true,
    jitterFactor: 0.3
  }),

  timeout: Object.freeze({
    phase: 30000,
    module: 10000,
    global: 120000,
    warning: 90000,
    minimum: 1000,
    maximum: 300000
  }),

  circuitBreaker: Object.freeze({
    enabled: true,
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
    resetTimeout: 60000
  }),

  bootLoop: Object.freeze({
    maxBootsInWindow: 3,
    windowMs: 30000,
    cooldownMs: 60000
  })
});

// ═══════════════════════════════════════════════════════════════
// PHASE-SPECIFIC RESILIENCE PRESETS
// ═══════════════════════════════════════════════════════════════

export const PHASE_RESILIENCE_PRESETS = Object.freeze({
  'phase-0-critical': Object.freeze({
    level: RESILIENCE_LEVEL.CRITICAL,
    retry: { enabled: false, maxAttempts: 1 },
    timeout: 5000,
    failFast: true,
    description: 'Fase crítica — EventBus/Logger obrigatórios, sem retry'
  }),

  'phase-1-core': Object.freeze({
    level: RESILIENCE_LEVEL.STANDARD,
    retry: { enabled: true, maxAttempts: 2, baseDelay: 1000 },
    timeout: 10000,
    failFast: false,
    description: 'Core services — retry moderado'
  }),

  'phase-2-auth': Object.freeze({
    level: RESILIENCE_LEVEL.STANDARD,
    retry: { enabled: true, maxAttempts: 2, baseDelay: 1500 },
    timeout: 15000,
    failFast: false,
    description: 'Autenticação — retry com delay maior'
  }),

  'phase-3-shell': Object.freeze({
    level: RESILIENCE_LEVEL.STANDARD,
    retry: { enabled: true, maxAttempts: 2, baseDelay: 1000 },
    timeout: 20000,
    failFast: false,
    description: 'Shell — retry padrão'
  }),

  'phase-4-main': Object.freeze({
    level: RESILIENCE_LEVEL.STANDARD,
    retry: { enabled: true, maxAttempts: 2, baseDelay: 1000 },
    timeout: 15000,
    failFast: false,
    description: 'Main content — retry padrão'
  }),

  'phase-5-ui': Object.freeze({
    level: RESILIENCE_LEVEL.MINIMAL,
    retry: { enabled: true, maxAttempts: 1, baseDelay: 500 },
    timeout: 10000,
    failFast: false,
    description: 'UI components — retry mínimo, não crítico'
  }),

  'phase-6-platform': Object.freeze({
    level: RESILIENCE_LEVEL.NONE,
    retry: { enabled: false, maxAttempts: 1 },
    timeout: 10000,
    failFast: false,
    description: 'Platform — sem retry, pode ser pulado'
  })
});

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

const VALID_LEVELS = Object.values(RESILIENCE_LEVEL);
const VALID_OUTCOMES = Object.values(RESILIENCE_OUTCOME);

export function isValidLevel(level: string) {
  return (VALID_LEVELS as readonly string[]).indexOf(level) !== -1;
}

export function isValidOutcome(outcome: string) {
  return (VALID_OUTCOMES as readonly string[]).indexOf(outcome) !== -1;
}

// ═══════════════════════════════════════════════════════════════
// isRetryAppropriate — Verifica se retry é apropriado para o contexto
// ═══════════════════════════════════════════════════════════════

export function isRetryAppropriate(errorType: string, context?: { phaseId?: string; attempt?: number; maxAttempts?: number; circuitOpen?: boolean }) {
  if (!errorType || typeof errorType !== 'string') {
    return false;
  }

  // Verificar se está na lista de proibidos
  if (RETRY_POLICY.FORBIDDEN_FOR.indexOf(errorType) !== -1) {
    return false;
  }

  // Verificar se está na lista de permitidos
  if (RETRY_POLICY.ALLOWED_FOR.indexOf(errorType) !== -1) {
    return true;
  }

  // Contexto adicional pode influenciar
  if (context) {
    // Se é fase crítica, não permite retry
    if (context.phaseId === 'phase-0-critical') {
      return false;
    }

    // Se já excedeu tentativas, não permite
    // @ts-expect-error strict migration — TS18048
    if (context.attempt >= context.maxAttempts) {
      return false;
    }

    // Se circuit breaker está aberto, não permite
    if (context.circuitOpen) {
      return false;
    }
  }

  // Default: não permite (fail-safe)
  return false;
}

// ═══════════════════════════════════════════════════════════════
// isTimeoutMeaningful — Verifica se timeout é significativo
// ═══════════════════════════════════════════════════════════════

export function isTimeoutMeaningful(operationType: string) {
  if (!operationType || typeof operationType !== 'string') {
    return true; // Default: assume que é significativo por segurança
  }

  // Verificar se NÃO é significativo
  if (TIMEOUT_POLICY.NOT_MEANINGFUL_FOR.indexOf(operationType) !== -1) {
    return false;
  }

  // Verificar se é significativo
  if (TIMEOUT_POLICY.MEANINGFUL_FOR.indexOf(operationType) !== -1) {
    return true;
  }

  // Default: assume significativo (fail-safe)
  return true;
}

// ═══════════════════════════════════════════════════════════════
// determineResilienceLevel — Determina nível apropriado
// ═══════════════════════════════════════════════════════════════

export function determineResilienceLevel(context?: { phaseId?: string; critical?: boolean; external?: boolean; optional?: boolean }) {
  if (!context) {
    return RESILIENCE_LEVEL.STANDARD;
  }

  // Se tem preset para a fase, usa
  if (context.phaseId && (PHASE_RESILIENCE_PRESETS as Record<string, { level: string }>)[context.phaseId]) {
    return (PHASE_RESILIENCE_PRESETS as Record<string, { level: string }>)[context.phaseId].level;
  }

  // Baseado em características
  if (context.critical === true) {
    return RESILIENCE_LEVEL.CRITICAL;
  }

  if (context.external === true) {
    return RESILIENCE_LEVEL.AGGRESSIVE;
  }

  if (context.optional === true) {
    return RESILIENCE_LEVEL.MINIMAL;
  }

  return RESILIENCE_LEVEL.STANDARD;
}

// ═══════════════════════════════════════════════════════════════
// getPresetForPhase — Obtém preset de resiliência para fase
// ═══════════════════════════════════════════════════════════════

export function getPresetForPhase(phaseId: string) {
  if (!phaseId || typeof phaseId !== 'string') {
    return null;
  }

  return (PHASE_RESILIENCE_PRESETS as Record<string, unknown>)[phaseId] || null;
}

// ═══════════════════════════════════════════════════════════════
// createRetryConfig — Factory para configuração de retry
// ═══════════════════════════════════════════════════════════════

export function createRetryConfig(opts?: { enabled?: boolean; maxAttempts?: number; delay?: number; baseDelay?: number; backoff?: number; backoffMultiplier?: number; maxDelay?: number; jitter?: boolean; jitterEnabled?: boolean; jitterFactor?: number }) {
  if (!opts) opts = {};

  const defaults = RESILIENCE_DEFAULTS.retry;

  return {
    enabled: opts.enabled !== undefined ? opts.enabled : defaults.enabled,
    maxAttempts: opts.maxAttempts || defaults.maxAttempts,
    delay: opts.delay || opts.baseDelay || defaults.baseDelay,
    baseDelay: opts.baseDelay || opts.delay || defaults.baseDelay,
    backoff: opts.backoff || opts.backoffMultiplier || defaults.backoffMultiplier,
    backoffMultiplier: opts.backoffMultiplier || opts.backoff || defaults.backoffMultiplier,
    maxDelay: opts.maxDelay || defaults.maxDelay,
    jitter: opts.jitter !== undefined ? opts.jitter : defaults.jitterEnabled,
    jitterEnabled: opts.jitterEnabled !== undefined ? opts.jitterEnabled : defaults.jitterEnabled,
    jitterFactor: opts.jitterFactor || defaults.jitterFactor
  };
}

// ═══════════════════════════════════════════════════════════════
// createTimeoutConfig — Factory para configuração de timeout
// ═══════════════════════════════════════════════════════════════

export function createTimeoutConfig(opts?: { timeout?: number; timeoutMs?: number; warning?: number; warningMs?: number; enabled?: boolean }) {
  if (!opts) opts = {};

  const defaults = RESILIENCE_DEFAULTS.timeout;

  let timeout = opts.timeout || opts.timeoutMs || defaults.module;

  // Enforce limites
  if (timeout < defaults.minimum) {
    timeout = defaults.minimum;
  }
  if (timeout > defaults.maximum) {
    timeout = defaults.maximum;
  }

  return {
    timeout: timeout,
    timeoutMs: timeout,
    warning: opts.warning || opts.warningMs || Math.round(timeout * 0.75),
    warningMs: opts.warningMs || opts.warning || Math.round(timeout * 0.75),
    enabled: opts.enabled !== undefined ? opts.enabled : true
  };
}

// ═══════════════════════════════════════════════════════════════
// createResilienceResult — Factory para resultado padronizado
// ═══════════════════════════════════════════════════════════════

export function createResilienceResult(opts?: { outcome?: string; timestamp?: number; duration?: number; phaseId?: string; attempt?: number; error?: string | { message?: string }; level?: string; details?: Record<string, unknown> }) {
  if (!opts) opts = {};

  // Outcome obrigatório
  let outcome = opts.outcome || RESILIENCE_OUTCOME.SUCCESS;
  if (!isValidOutcome(outcome)) {
    outcome = RESILIENCE_OUTCOME.SUCCESS;
  }

  const result: { outcome: string; success: boolean; timestamp: number; duration: number; [key: string]: unknown } = {
    outcome: outcome,
    success: outcome === RESILIENCE_OUTCOME.SUCCESS ||
             outcome === RESILIENCE_OUTCOME.SUCCESS_AFTER_RETRY ||
             outcome === RESILIENCE_OUTCOME.DEGRADED,
    timestamp: opts.timestamp || Date.now(),
    duration: opts.duration || 0
  };

  // Campos opcionais
  if (opts.phaseId) {
    result.phaseId = opts.phaseId;
  }

  if (opts.attempt !== undefined) {
    result.attempt = opts.attempt;
    result.retriesUsed = opts.attempt > 1 ? opts.attempt - 1 : 0;
  }

  if (opts.error) {
    result.error = typeof opts.error === 'string' ? opts.error : opts.error.message || 'Unknown error';
  }

  if (opts.level) {
    result.level = opts.level;
  }

  if (opts.details && typeof opts.details === 'object') {
    result.details = opts.details;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// validateResilienceResult — Valida conformidade com contrato
// ═══════════════════════════════════════════════════════════════

export function validateResilienceResult(result: Record<string, unknown> | null) {
  const errors = [];

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['Result must be an object'] };
  }

  // Outcome obrigatório
  if (!result.outcome || typeof result.outcome !== 'string') {
    errors.push('Missing or invalid: outcome (string required)');
  } else if (!isValidOutcome(result.outcome)) {
    errors.push('Invalid outcome "' + result.outcome + '". Must be one of: ' + VALID_OUTCOMES.join(', '));
  }

  // Success deve ser boolean
  if (result.success !== undefined && typeof result.success !== 'boolean') {
    errors.push('Field "success" must be a boolean');
  }

  // Timestamp deve ser number
  if (result.timestamp !== undefined && typeof result.timestamp !== 'number') {
    errors.push('Field "timestamp" must be a number');
  }

  // Duration deve ser number
  if (result.duration !== undefined && typeof result.duration !== 'number') {
    errors.push('Field "duration" must be a number');
  }

  // Level se presente deve ser válido
  if (result.level !== undefined && !isValidLevel(result.level as string)) {
    errors.push('Invalid level "' + result.level + '". Must be one of: ' + VALID_LEVELS.join(', '));
  }

  return { valid: errors.length === 0, errors: errors };
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    policies: {
      retryAllowedFor: RETRY_POLICY.ALLOWED_FOR.length,
      retryForbiddenFor: RETRY_POLICY.FORBIDDEN_FOR.length,
      timeoutMeaningfulFor: TIMEOUT_POLICY.MEANINGFUL_FOR.length,
      timeoutNotMeaningfulFor: TIMEOUT_POLICY.NOT_MEANINGFUL_FOR.length
    },
    levels: VALID_LEVELS.slice(),
    outcomes: VALID_OUTCOMES.slice(),
    phasePresets: Object.keys(PHASE_RESILIENCE_PRESETS),
    defaults: {
      retryMaxAttempts: RESILIENCE_DEFAULTS.retry.maxAttempts,
      retryBaseDelay: RESILIENCE_DEFAULTS.retry.baseDelay,
      timeoutGlobal: RESILIENCE_DEFAULTS.timeout.global,
      timeoutModule: RESILIENCE_DEFAULTS.timeout.module
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  MODULE_ID,
  VERSION,
  VALID_LEVELS,
  VALID_OUTCOMES
};

export default {
  MODULE_ID,
  VERSION,
  RETRY_POLICY,
  TIMEOUT_POLICY,
  RESILIENCE_LEVEL,
  RESILIENCE_OUTCOME,
  RESILIENCE_DEFAULTS,
  PHASE_RESILIENCE_PRESETS,
  isValidLevel,
  isValidOutcome,
  isRetryAppropriate,
  isTimeoutMeaningful,
  determineResilienceLevel,
  getPresetForPhase,
  createRetryConfig,
  createTimeoutConfig,
  createResilienceResult,
  validateResilienceResult,
  info
};
