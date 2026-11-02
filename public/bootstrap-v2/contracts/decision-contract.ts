
// Decision Contract — Contrato Formal de Decisões do Phase Executor
// @version 1.0.0
// @description Centraliza todas as decisões do bootstrap em funções puras
// @principle "Bootstrap executa, Contratos decidem, Eventos informam"
// @changelog v1.0.0: Criação do contrato formal de decisões
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained, pure functions)
// PROVIDES:
//   DECISION_OUTCOMES         — Vocabulário canônico de outcomes
//   DECISION_CONTEXT          — Tipos de contexto de decisão
//   resolveErrorDecision()    — Decide outcome de erro
//   resolveRecoveryDecision() — Decide outcome após recovery falhar
//   resolveSkipDecision()     — Decide se/como pular fase
//   resolveSuppressionDecision() — Decide se suprimir erro
//   resolveDependencyDecision()  — Decide sobre dependências
//   resolvePhaseProceedDecision() — Decide se fase pode prosseguir
//   createDecisionResult()    — Factory para resultado padronizado
//   validateDecisionResult()  — Validador de conformidade
//   info()                    — Informações do módulo
// WINDOW ACCESS: None
// SIDE-EFFECTS: None — pure functions only
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'decision-contract';
const VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// DECISION_OUTCOMES — Vocabulário canônico de outcomes
// ═══════════════════════════════════════════════════════════════

export const DECISION_OUTCOMES = Object.freeze({
  // ─────────────────────────────────────────────────────────────
  // ERROR OUTCOMES
  // ─────────────────────────────────────────────────────────────
  RECOVER: 'recover',                           // Phase has recover() and is recoverable
  SUPPRESS: 'suppress',                         // Error suppressed by policy
  FAIL_CRITICAL: 'fail-critical',               // Critical failure, boot stops
  FAIL_SOFT: 'fail-soft',                       // Non-critical, boot continues
  ROLLBACK_THEN_SUPPRESS: 'rollback-then-suppress', // Rollback first, then suppress
  ROLLBACK_THEN_FAIL: 'rollback-then-fail',     // Rollback first, then fail

  // ─────────────────────────────────────────────────────────────
  // SKIP OUTCOMES
  // ─────────────────────────────────────────────────────────────
  SKIP_CIRCUIT_OPEN: 'skip-circuit-open',       // Circuit breaker is open
  SKIP_DEPENDENCY_MISSING: 'skip-dependency-missing', // Required dependency missing
  SKIP_OPTIONAL: 'skip-optional',               // Optional phase skipped
  SKIP_UNAUTH: 'skip-unauth',                   // Skipped because not authenticated

  // ─────────────────────────────────────────────────────────────
  // PROCEED OUTCOMES
  // ─────────────────────────────────────────────────────────────
  PROCEED: 'proceed',                           // Normal execution
  PROCEED_DEGRADED: 'proceed-degraded',         // Proceed in degraded mode

  // ─────────────────────────────────────────────────────────────
  // SUPPRESSION OUTCOMES
  // ─────────────────────────────────────────────────────────────
  SUPPRESS_UNAUTH: 'suppress-unauth',           // Suppressed because not authenticated
  SUPPRESS_POLICY: 'suppress-policy',           // Suppressed by explicit policy

  // ─────────────────────────────────────────────────────────────
  // DEPENDENCY OUTCOMES
  // ─────────────────────────────────────────────────────────────
  DEPS_SATISFIED: 'deps-satisfied',             // All dependencies met
  DEPS_MISSING_CRITICAL: 'deps-missing-critical', // Critical dependency missing
  DEPS_MISSING_OPTIONAL: 'deps-missing-optional'  // Optional dependency missing
});

// ═══════════════════════════════════════════════════════════════
// DECISION_CONTEXT — Tipos de contexto de decisão
// ═══════════════════════════════════════════════════════════════

export const DECISION_CONTEXT = Object.freeze({
  ERROR: 'error',
  RECOVERY: 'recovery',
  SKIP: 'skip',
  SUPPRESSION: 'suppression',
  DEPENDENCY: 'dependency',
  PROCEED: 'proceed'
});

// ═══════════════════════════════════════════════════════════════
// VALID VALUES
// ═══════════════════════════════════════════════════════════════

const VALID_OUTCOMES = Object.values(DECISION_OUTCOMES);
const VALID_CONTEXTS = Object.values(DECISION_CONTEXT);

export function isValidOutcome(outcome: string) {
  return (VALID_OUTCOMES as readonly string[]).indexOf(outcome) !== -1;
}

export function isValidContext(context: string) {
  return (VALID_CONTEXTS as readonly string[]).indexOf(context) !== -1;
}

// ═══════════════════════════════════════════════════════════════
// 1. resolveErrorDecision — Decide outcome de erro de fase
// ═══════════════════════════════════════════════════════════════
// Input: { recoverable, hasRecover, critical, shouldSuppress }
// Output: { outcome, reason, context }

export function resolveErrorDecision(input: { recoverable?: boolean; hasRecover?: boolean; critical?: boolean; shouldSuppress?: boolean } | null) {
  if (!input) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.FAIL_SOFT,
      reason: 'No input provided',
      context: DECISION_CONTEXT.ERROR
    });
  }

  const recoverable = !!input.recoverable;
  const hasRecover = !!input.hasRecover;
  const critical = !!input.critical;
  const shouldSuppress = !!input.shouldSuppress;

  // Path 1: Recovery available
  if (recoverable && hasRecover) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.RECOVER,
      reason: 'Phase is recoverable and has recover() method',
      context: DECISION_CONTEXT.ERROR
    });
  }

  // Path 2: Critical phase, check suppression
  if (critical) {
    if (shouldSuppress) {
      return createDecisionResult({
        outcome: DECISION_OUTCOMES.SUPPRESS,
        reason: 'Critical phase but suppression policy allows continuation',
        context: DECISION_CONTEXT.ERROR
      });
    }
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.FAIL_CRITICAL,
      reason: 'Critical phase failed with no recovery or suppression',
      context: DECISION_CONTEXT.ERROR
    });
  }

  // Path 3: Non-critical, soft fail
  return createDecisionResult({
    outcome: DECISION_OUTCOMES.FAIL_SOFT,
    reason: 'Non-critical phase failed, boot continues',
    context: DECISION_CONTEXT.ERROR
  });
}

// ═══════════════════════════════════════════════════════════════
// 2. resolveRecoveryDecision — Decide outcome após recovery falhar
// ═══════════════════════════════════════════════════════════════
// Input: { critical, shouldSuppress, hasRollback }
// Output: { outcome, reason, context }

export function resolveRecoveryDecision(input: { critical?: boolean; shouldSuppress?: boolean; hasRollback?: boolean } | null) {
  if (!input) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.FAIL_SOFT,
      reason: 'No input provided',
      context: DECISION_CONTEXT.RECOVERY
    });
  }

  const critical = !!input.critical;
  const shouldSuppress = !!input.shouldSuppress;
  const hasRollback = !!input.hasRollback;

  if (critical) {
    if (shouldSuppress) {
      return createDecisionResult({
        outcome: hasRollback ? DECISION_OUTCOMES.ROLLBACK_THEN_SUPPRESS : DECISION_OUTCOMES.SUPPRESS,
        reason: 'Recovery failed but suppression allows continuation' + (hasRollback ? ' (with rollback)' : ''),
        context: DECISION_CONTEXT.RECOVERY
      });
    }
    return createDecisionResult({
      outcome: hasRollback ? DECISION_OUTCOMES.ROLLBACK_THEN_FAIL : DECISION_OUTCOMES.FAIL_CRITICAL,
      reason: 'Recovery failed, critical phase cannot continue' + (hasRollback ? ' (with rollback)' : ''),
      context: DECISION_CONTEXT.RECOVERY
    });
  }

  return createDecisionResult({
    outcome: DECISION_OUTCOMES.FAIL_SOFT,
    reason: 'Recovery failed but phase is non-critical',
    context: DECISION_CONTEXT.RECOVERY
  });
}

// ═══════════════════════════════════════════════════════════════
// 3. resolveSkipDecision — Decide se/como pular fase
// ═══════════════════════════════════════════════════════════════
// Input: { circuitOpen, dependencyMissing, optional, authenticated, phaseId }
// Output: { outcome, reason, context, shouldSkip }

export function resolveSkipDecision(input: { circuitOpen?: boolean; dependencyMissing?: boolean; optional?: boolean; authenticated?: boolean; phaseId?: string; skipOptional?: boolean } | null) {
  if (!input) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.PROCEED,
      reason: 'No input provided, proceeding',
      context: DECISION_CONTEXT.SKIP,
      shouldSkip: false
    });
  }

  const circuitOpen = !!input.circuitOpen;
  const dependencyMissing = !!input.dependencyMissing;
  const optional = !!input.optional;
  const authenticated = input.authenticated !== false; // default true
  const phaseId = input.phaseId || 'unknown';

  // Priority 1: Circuit breaker open
  if (circuitOpen) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.SKIP_CIRCUIT_OPEN,
      reason: 'Circuit breaker is open for ' + phaseId,
      context: DECISION_CONTEXT.SKIP,
      shouldSkip: true
    });
  }

  // Priority 2: Dependency missing
  if (dependencyMissing) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.SKIP_DEPENDENCY_MISSING,
      reason: 'Required dependency missing for ' + phaseId,
      context: DECISION_CONTEXT.SKIP,
      shouldSkip: true
    });
  }

  // Priority 3: Auth-dependent phases when not authenticated
  if (!authenticated && (phaseId === 'phase-3-shell' || phaseId === 'phase-4-main')) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.SKIP_UNAUTH,
      reason: 'Phase ' + phaseId + ' skipped because not authenticated',
      context: DECISION_CONTEXT.SKIP,
      shouldSkip: true
    });
  }

  // Priority 4: Optional phase that can be skipped
  if (optional && input.skipOptional) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.SKIP_OPTIONAL,
      reason: 'Optional phase ' + phaseId + ' skipped by configuration',
      context: DECISION_CONTEXT.SKIP,
      shouldSkip: true
    });
  }

  // Default: proceed
  return createDecisionResult({
    outcome: DECISION_OUTCOMES.PROCEED,
    reason: 'All checks passed, proceeding with ' + phaseId,
    context: DECISION_CONTEXT.SKIP,
    shouldSkip: false
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. resolveSuppressionDecision — Decide se suprimir erro
// ═══════════════════════════════════════════════════════════════
// Input: { phaseId, authenticated, suppressWhenUnauth, suppressPolicy }
// Output: { outcome, reason, context, shouldSuppress }

export function resolveSuppressionDecision(input: { phaseId?: string; authenticated?: boolean; suppressWhenUnauth?: boolean; suppressPolicy?: boolean } | null) {
  if (!input) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.FAIL_SOFT,
      reason: 'No input provided',
      context: DECISION_CONTEXT.SUPPRESSION,
      shouldSuppress: false
    });
  }

  const phaseId = input.phaseId || 'unknown';
  const authenticated = !!input.authenticated;
  const suppressWhenUnauth = !!input.suppressWhenUnauth;
  const suppressPolicy = !!input.suppressPolicy;

  // Suppress if configured and not authenticated
  if (suppressWhenUnauth && !authenticated) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.SUPPRESS_UNAUTH,
      reason: 'Suppressed because not authenticated (suppressWhenUnauth)',
      context: DECISION_CONTEXT.SUPPRESSION,
      shouldSuppress: true,
      phaseId: phaseId
    });
  }

  // Suppress phase-3-shell if not authenticated
  if (phaseId === 'phase-3-shell' && !authenticated) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.SUPPRESS_UNAUTH,
      reason: 'phase-3-shell suppressed because not authenticated',
      context: DECISION_CONTEXT.SUPPRESSION,
      shouldSuppress: true,
      phaseId: phaseId
    });
  }

  // Explicit suppression policy
  if (suppressPolicy) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.SUPPRESS_POLICY,
      reason: 'Suppressed by explicit policy',
      context: DECISION_CONTEXT.SUPPRESSION,
      shouldSuppress: true,
      phaseId: phaseId
    });
  }

  // Default: don't suppress
  return createDecisionResult({
    outcome: DECISION_OUTCOMES.PROCEED,
    reason: 'No suppression conditions met',
    context: DECISION_CONTEXT.SUPPRESSION,
    shouldSuppress: false,
    phaseId: phaseId
  });
}

// ═══════════════════════════════════════════════════════════════
// 5. resolveDependencyDecision — Decide sobre dependências
// ═══════════════════════════════════════════════════════════════
// Input: { dependencies[], resolvedDeps[], critical }
// Output: { outcome, reason, context, missingDeps }

export function resolveDependencyDecision(input: { dependencies?: (string | { name: string; required?: boolean })[]; resolvedDeps?: string[]; critical?: boolean } | null) {
  if (!input) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.DEPS_SATISFIED,
      reason: 'No input provided, assuming satisfied',
      context: DECISION_CONTEXT.DEPENDENCY,
      missingDeps: []
    });
  }

  const dependencies = input.dependencies || [];
  const resolvedDeps = input.resolvedDeps || [];
  const critical = !!input.critical;

  // Find missing dependencies
  const missingDeps = [];
  for (let i = 0; i < dependencies.length; i++) {
    const dep = dependencies[i];
    const depName = typeof dep === 'string' ? dep : dep.name;
    const depRequired = typeof dep === 'object' ? dep.required !== false : true;

    if (resolvedDeps.indexOf(depName) === -1) {
      missingDeps.push({ name: depName, required: depRequired });
    }
  }

  // No missing dependencies
  if (missingDeps.length === 0) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.DEPS_SATISFIED,
      reason: 'All ' + dependencies.length + ' dependencies satisfied',
      context: DECISION_CONTEXT.DEPENDENCY,
      missingDeps: []
    });
  }

  // Check if any missing is required
  const missingRequired = missingDeps.filter(function(d) { return d.required; });

  if (missingRequired.length > 0) {
    return createDecisionResult({
      outcome: critical ? DECISION_OUTCOMES.DEPS_MISSING_CRITICAL : DECISION_OUTCOMES.DEPS_MISSING_OPTIONAL,
      reason: missingRequired.length + ' required dependencies missing',
      context: DECISION_CONTEXT.DEPENDENCY,
      missingDeps: missingDeps
    });
  }

  // Only optional missing
  return createDecisionResult({
    outcome: DECISION_OUTCOMES.DEPS_MISSING_OPTIONAL,
    reason: missingDeps.length + ' optional dependencies missing',
    context: DECISION_CONTEXT.DEPENDENCY,
    missingDeps: missingDeps
  });
}

// ═══════════════════════════════════════════════════════════════
// 6. resolvePhaseProceedDecision — Decide se fase pode prosseguir
// ═══════════════════════════════════════════════════════════════
// Input: { phaseId, bootState, previousPhaseSuccess, degraded }
// Output: { outcome, reason, context, canProceed }

export function resolvePhaseProceedDecision(input: { phaseId?: string; bootState?: string; previousPhaseSuccess?: boolean; degraded?: boolean; previousPhaseCritical?: boolean } | null) {
  if (!input) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.PROCEED,
      reason: 'No input provided, proceeding',
      context: DECISION_CONTEXT.PROCEED,
      canProceed: true
    });
  }

  const phaseId = input.phaseId || 'unknown';
  const bootState = input.bootState || 'running';
  const previousPhaseSuccess = input.previousPhaseSuccess !== false;
  const degraded = !!input.degraded;

  // Boot failed, cannot proceed
  if (bootState === 'failed') {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.FAIL_CRITICAL,
      reason: 'Boot is in failed state, cannot proceed with ' + phaseId,
      context: DECISION_CONTEXT.PROCEED,
      canProceed: false
    });
  }

  // Previous phase failed critically
  if (!previousPhaseSuccess && input.previousPhaseCritical) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.FAIL_CRITICAL,
      reason: 'Previous critical phase failed, cannot proceed with ' + phaseId,
      context: DECISION_CONTEXT.PROCEED,
      canProceed: false
    });
  }

  // Degraded mode
  if (degraded) {
    return createDecisionResult({
      outcome: DECISION_OUTCOMES.PROCEED_DEGRADED,
      reason: 'Proceeding with ' + phaseId + ' in degraded mode',
      context: DECISION_CONTEXT.PROCEED,
      canProceed: true
    });
  }

  // Normal proceed
  return createDecisionResult({
    outcome: DECISION_OUTCOMES.PROCEED,
    reason: 'Proceeding normally with ' + phaseId,
    context: DECISION_CONTEXT.PROCEED,
    canProceed: true
  });
}

// ═══════════════════════════════════════════════════════════════
// createDecisionResult — Factory para resultado padronizado
// ═══════════════════════════════════════════════════════════════

export function createDecisionResult(opts?: { outcome?: string; reason?: string; context?: string; timestamp?: number; shouldSkip?: boolean; shouldSuppress?: boolean; canProceed?: boolean; missingDeps?: { name: string; required: boolean }[]; phaseId?: string }) {
  if (!opts) opts = {};

  const result: { outcome: string; reason: string; context: string; timestamp: number; [key: string]: unknown } = {
    outcome: opts.outcome || DECISION_OUTCOMES.PROCEED,
    reason: opts.reason || 'No reason provided',
    context: opts.context || DECISION_CONTEXT.PROCEED,
    timestamp: opts.timestamp || Date.now()
  };

  // Optional fields based on context
  if (opts.shouldSkip !== undefined) {
    result.shouldSkip = opts.shouldSkip;
  }
  if (opts.shouldSuppress !== undefined) {
    result.shouldSuppress = opts.shouldSuppress;
  }
  if (opts.canProceed !== undefined) {
    result.canProceed = opts.canProceed;
  }
  if (opts.missingDeps !== undefined) {
    result.missingDeps = opts.missingDeps;
  }
  if (opts.phaseId !== undefined) {
    result.phaseId = opts.phaseId;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// validateDecisionResult — Valida conformidade com contrato
// ═══════════════════════════════════════════════════════════════

export function validateDecisionResult(result: Record<string, unknown> | null) {
  const errors = [];

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['Result must be an object'] };
  }

  if (!result.outcome || typeof result.outcome !== 'string') {
    errors.push('Missing or invalid: outcome (string required)');
  } else if (!isValidOutcome(result.outcome)) {
    errors.push('Invalid outcome "' + result.outcome + '"');
  }

  if (!result.reason || typeof result.reason !== 'string') {
    errors.push('Missing or invalid: reason (string required)');
  }

  if (!result.context || typeof result.context !== 'string') {
    errors.push('Missing or invalid: context (string required)');
  } else if (!isValidContext(result.context)) {
    errors.push('Invalid context "' + result.context + '"');
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
    principle: 'Bootstrap executes, Contracts decide, Events inform',
    outcomes: VALID_OUTCOMES.slice(),
    contexts: VALID_CONTEXTS.slice(),
    resolvers: [
      'resolveErrorDecision',
      'resolveRecoveryDecision',
      'resolveSkipDecision',
      'resolveSuppressionDecision',
      'resolveDependencyDecision',
      'resolvePhaseProceedDecision'
    ]
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { MODULE_ID, VERSION, VALID_OUTCOMES, VALID_CONTEXTS };

export default {
  MODULE_ID,
  VERSION,
  DECISION_OUTCOMES,
  DECISION_CONTEXT,
  isValidOutcome,
  isValidContext,
  resolveErrorDecision,
  resolveRecoveryDecision,
  resolveSkipDecision,
  resolveSuppressionDecision,
  resolveDependencyDecision,
  resolvePhaseProceedDecision,
  createDecisionResult,
  validateDecisionResult,
  info
};
