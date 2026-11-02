// Error Outcome Resolver — Separação Decisão/Execução (Etapa 7, P1)
// @version 2.0.0-DECISION-CONTRACT
// @description Wrapper que delega decisões para decision-contract.js
// @principle "Bootstrap executa, Contratos decidem, Eventos informam"
// @changelog v2.0.0-DECISION-CONTRACT: Migrado para usar decision-contract.js
// @changelog v1.0.0-STEP7: Versão inicial com funções puras locais
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   DECISION_OUTCOMES, resolveErrorDecision, resolveRecoveryDecision,
//   createDecisionResult from ../../../../contracts/decision-contract.js
//
// PROVIDES (backward compatible):
//   OUTCOMES                      — Re-exported from contract
//   resolveErrorOutcome()         — Wrapper for resolveErrorDecision
//   resolveRecoveryFailureOutcome() — Wrapper for resolveRecoveryDecision
//   resolveSuppressionOutcome()   — Local (returns execution result, not decision)
//   info()                        — Module info
//
// WINDOW ACCESS: None
// SIDE-EFFECTS: None — pure functions only
// ═══════════════════════════════════════════════════════════════
'use strict';

import {
  DECISION_OUTCOMES,
  resolveErrorDecision,
  resolveRecoveryDecision,
  createDecisionResult
} from '../../../../contracts/decision-contract.js';

const MODULE_ID = 'error-outcome-resolver';
const VERSION = '2.0.0-DECISION-CONTRACT';

// ─────────────────────────────────────────────────────────────
// OUTCOMES — Re-export for backward compatibility
// ─────────────────────────────────────────────────────────────
// Maps contract outcomes to legacy names
const OUTCOMES = {
  RECOVER: DECISION_OUTCOMES.RECOVER,
  SUPPRESS: DECISION_OUTCOMES.SUPPRESS,
  FAIL_CRITICAL: DECISION_OUTCOMES.FAIL_CRITICAL,
  FAIL_SOFT: DECISION_OUTCOMES.FAIL_SOFT,
  ROLLBACK_THEN_SUPPRESS: DECISION_OUTCOMES.ROLLBACK_THEN_SUPPRESS,
  ROLLBACK_THEN_FAIL: DECISION_OUTCOMES.ROLLBACK_THEN_FAIL
};

// ─────────────────────────────────────────────────────────────
// 1. resolveErrorOutcome — Wrapper for backward compatibility
// ─────────────────────────────────────────────────────────────
// Input: { recoverable, hasRecover, critical, shouldSuppress }
// Output: { outcome: OUTCOMES.*, reason: string }
interface ErrorOutcomeInput {
  recoverable: boolean;
  hasRecover: boolean;
  critical: boolean;
  shouldSuppress: boolean;
}

interface RecoveryFailureInput {
  critical: boolean;
  shouldSuppress: boolean;
  hasRollback: boolean;
}

interface SuppressionInput {
  phaseId?: string;
  error?: { message: string };
  phaseTime?: number;
}

function resolveErrorOutcome(input: ErrorOutcomeInput) {
  const decision = resolveErrorDecision(input);
  
  // Return in legacy format (without context/timestamp)
  return {
    outcome: decision.outcome,
    reason: decision.reason
  };
}

// ─────────────────────────────────────────────────────────────
// 2. resolveRecoveryFailureOutcome — Wrapper for backward compatibility
// ─────────────────────────────────────────────────────────────
// Input: { critical, shouldSuppress, hasRollback }
// Output: { outcome: OUTCOMES.*, reason: string }
function resolveRecoveryFailureOutcome(input: RecoveryFailureInput) {
  const decision = resolveRecoveryDecision(input);
  
  // Return in legacy format
  return {
    outcome: decision.outcome,
    reason: decision.reason
  };
}

// ─────────────────────────────────────────────────────────────
// 3. resolveSuppressionOutcome — Execution result (not decision)
// ─────────────────────────────────────────────────────────────
// This function returns an EXECUTION result, not a decision.
// It's kept here for backward compatibility with error-handler.js
// Input: { phaseId, error, phaseTime }
// Output: { status, result }
function resolveSuppressionOutcome(input: SuppressionInput) {
  if (!input) input = {};
  return {
    status: 'recovered',
    result: {
      success: true,
      recovered: true,
      degraded: true,
      suppressed: true,
      phaseId: input.phaseId || 'unknown',
      time: input.phaseTime || 0,
      error: input.error && input.error.message ? input.error.message : 'unknown'
    }
  };
}

// ─────────────────────────────────────────────────────────────
// DIAGNOSTICS
// ─────────────────────────────────────────────────────────────
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    description: 'Wrapper for decision-contract.js (backward compatible)',
    principle: 'Bootstrap executes, Contracts decide, Events inform',
    outcomes: Object.keys(OUTCOMES),
    resolvers: ['resolveErrorOutcome', 'resolveRecoveryFailureOutcome', 'resolveSuppressionOutcome'],
    contractVersion: '1.0.0',
    delegatesTo: 'decision-contract.js'
  };
}

export {
  OUTCOMES,
  resolveErrorOutcome,
  resolveRecoveryFailureOutcome,
  resolveSuppressionOutcome,
  info
};

export default {
  OUTCOMES: OUTCOMES,
  resolveErrorOutcome: resolveErrorOutcome,
  resolveRecoveryFailureOutcome: resolveRecoveryFailureOutcome,
  resolveSuppressionOutcome: resolveSuppressionOutcome,
  info: info
};
