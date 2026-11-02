// Migrado para TypeScript: 2026-02-25
// Mode Transition Rules - Regras de transicao de modo
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Define transicoes validas entre modos do kernel
// @melhoria #15 - Prevenir transicoes invalidas de modo
'use strict';

export const MODULE_ID = 'mode-transition-rules' as const;
export const VERSION = '1.0.0' as const;

const ALLOWED_TRANSITIONS = {
  INITIALIZING: ['NORMAL', 'DEGRADED', 'MAINTENANCE', 'FAILED'],
  NORMAL: ['DEGRADED', 'MAINTENANCE', 'FAILED'],
  DEGRADED: ['NORMAL', 'MAINTENANCE', 'FAILED', 'RECOVERY'],
  MAINTENANCE: ['NORMAL', 'DEGRADED', 'FAILED'],
  FAILED: ['RECOVERY', 'MAINTENANCE'],
  RECOVERY: ['NORMAL', 'DEGRADED', 'FAILED']
} as const;

export type TransitionSourceMode = keyof typeof ALLOWED_TRANSITIONS;
export type TransitionMap = typeof ALLOWED_TRANSITIONS;

interface ValidationResult {
  valid: boolean;
  reason: string;
  from?: string;
  to?: string;
  allowed?: readonly string[];
}

interface ModeTransitionRulesInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  transitions: TransitionMap;
}

export function isValidTransition(fromMode: string, toMode: string): boolean {
  if (fromMode === toMode) return true;
  const allowed = ALLOWED_TRANSITIONS[fromMode as TransitionSourceMode];
  if (!allowed) return false;
  return (allowed as readonly string[]).indexOf(toMode) !== -1;
}

export function getAllowedTransitions(fromMode: string): readonly string[] {
  return ALLOWED_TRANSITIONS[fromMode as TransitionSourceMode] || [];
}

export function validateTransition(fromMode: string, toMode: string): ValidationResult {
  if (fromMode === toMode) {
    return { valid: true, reason: 'same-mode' };
  }
  if (!ALLOWED_TRANSITIONS[fromMode as TransitionSourceMode]) {
    return { valid: false, reason: `unknown-source-mode: ${fromMode}` };
  }
  if (isValidTransition(fromMode, toMode)) {
    return { valid: true, reason: 'allowed' };
  }
  return {
    valid: false,
    reason: 'transition-not-allowed',
    from: fromMode,
    to: toMode,
    allowed: getAllowedTransitions(fromMode)
  };
}

export { ALLOWED_TRANSITIONS };

export function info(): ModeTransitionRulesInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    transitions: ALLOWED_TRANSITIONS
  };
}

export default {
  MODULE_ID,
  VERSION,
  ALLOWED_TRANSITIONS,
  isValidTransition,
  getAllowedTransitions,
  validateTransition,
  info
};
