// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:error-handler
// PURPOSE: Error Handler Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ERROR_SEVERITY — exported value
//   ERROR_CATEGORIES — exported value
//   RECOVERY_ACTIONS — exported value
//   MAX_ERROR_LOG — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:error-handler';

// Severidades de erro
export const ERROR_SEVERITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
});

// Categorias de erro
export const ERROR_CATEGORIES = Object.freeze({
  NETWORK: 'network',
  VALIDATION: 'validation',
  SECURITY: 'security',
  RESOURCE: 'resource',
  LIFECYCLE: 'lifecycle',
  RENDER: 'render',
  STATE: 'state',
  UNKNOWN: 'unknown'
});

// Ações de recuperação
export const RECOVERY_ACTIONS = Object.freeze({
  RETRY: 'retry',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
  PROPAGATE: 'propagate',
  RESET: 'reset'
});

// Limites
export const MAX_ERROR_LOG = 200;

export default {
  VERSION, MODULE_ID,
  ERROR_SEVERITY, ERROR_CATEGORIES, RECOVERY_ACTIONS,
  MAX_ERROR_LOG
};
