// Execution - Barrel Export
// @version 4.0.0-STEP7
// @changelog v4.0.0-STEP7: Re-export error-outcome-resolver (Etapa 7 — separação decisão/execução)
// DEPENDENCY CONTRACT (v4.0.0) — BARREL FILE
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.execution';

export { createDependencyChecker } from './dependency-checker.js';
export { createSuccessHandler } from './success-handler.js';
export { createSuppressionHandler } from './suppression-handler.js';
export { createErrorHandler } from './error-handler.js';
export { createSkipHandler } from './skip-handler.js';
export { createPhaseRunner } from './phase-runner.js';
export {
  OUTCOMES,
  resolveErrorOutcome,
  resolveRecoveryFailureOutcome,
  resolveSuppressionOutcome
} from './error-outcome-resolver.js';
