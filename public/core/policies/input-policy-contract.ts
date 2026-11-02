// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.policies.input-policy-contract
// PURPOSE: Define estados e regras formais para controle de input
// ───────────────────────────────────────────────────────────────
// @contract INPUT_POLICY_CONTRACT - Contrato de política de input
// @contract STATE_MACHINE - Estados e transições permitidas
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (standalone contract)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   INPUT_STATES — enum de estados
//   BLOCK_PRIORITIES — prioridades de bloqueio
//   INPUT_RULES — regras formais
//   ALLOWED_TRANSITIONS — transições válidas
//   isValidTransition(from, to) — valida transição
//   getStatePriority(state) — obtém prioridade
//   isBlockingState(state) — verifica se bloqueia
//   checkForbiddenPattern(cssText) — verifica anti-padrão
//   healthCheck() — status de saúde
//   info() — informações do módulo
//
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.2.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.policies.input-policy-contract';

// Estados de Input
export const INPUT_STATES = Object.freeze({
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  LOADING_UI: 'LOADING_UI',
  BLOCKED_MODAL: 'BLOCKED_MODAL',
  BLOCKED_DRAG: 'BLOCKED_DRAG'
});

// Prioridades de bloqueio (maior = mais prioritário)
export const BLOCK_PRIORITIES = Object.freeze({
  ACTIVE: 0,
  LOADING_UI: 10,
  DISABLED: 50,
  BLOCKED_DRAG: 70,
  BLOCKED_MODAL: 100
});

// Anti-padrões proibidos
export const FORBIDDEN_PATTERNS = Object.freeze([
  { pattern: 'visibility: hidden', reason: 'Bloqueia input sem contrato explícito', alternative: 'opacity: 0 ou display: none com InputPolicyManager' },
  { pattern: 'pointer-events: none', reason: 'Bloqueia input em wrappers', alternative: 'InputPolicyManager.block()' },
  { pattern: 'user-select: none + pointer-events', reason: 'Combo que bloqueia interação', alternative: 'InputPolicyManager.block()' }
]);

// Regras obrigatórias
export const INPUT_RULES = Object.freeze({
  RULE_001: { id: 'NO_CSS_INPUT_BLOCK', description: 'Nenhum componente pode bloquear input usando CSS estrutural', severity: 'CRITICAL' },
  RULE_002: { id: 'EXPLICIT_BLOCK', description: 'Bloqueio de input deve ser explícito via InputPolicyManager', severity: 'CRITICAL' },
  RULE_003: { id: 'CENTRALIZED_CONTROL', description: 'Toda decisão de input passa por InputPolicyManager', severity: 'HIGH' },
  RULE_004: { id: 'TRACEABLE_STATE', description: 'Estado de input deve ser rastreável e observável', severity: 'HIGH' },
  RULE_005: { id: 'LOADING_NO_BLOCK', description: 'Loading visual NÃO implica bloqueio de input', severity: 'CRITICAL' },
  RULE_006: { id: 'SINGLE_EVENT_BUS', description: 'Apenas um EventBus para UI actions', severity: 'MEDIUM' }
});

// Transições permitidas entre estados
export const ALLOWED_TRANSITIONS = Object.freeze({
  ACTIVE: ['DISABLED', 'LOADING_UI', 'BLOCKED_MODAL', 'BLOCKED_DRAG'],
  DISABLED: ['ACTIVE'],
  LOADING_UI: ['ACTIVE', 'BLOCKED_MODAL'],
  BLOCKED_MODAL: ['ACTIVE', 'LOADING_UI'],
  BLOCKED_DRAG: ['ACTIVE']
});

// Validar transição
export const isValidTransition = (from: string, to: string) => {
  if (!(from in ALLOWED_TRANSITIONS)) return false;
  return ALLOWED_TRANSITIONS[from as keyof typeof ALLOWED_TRANSITIONS].indexOf(to) !== -1;
};

// Obter prioridade do estado
export const getStatePriority = (state: string) => BLOCK_PRIORITIES[state as keyof typeof BLOCK_PRIORITIES] !== undefined ? BLOCK_PRIORITIES[state as keyof typeof BLOCK_PRIORITIES] : 0;

// Verificar se estado bloqueia input
export const isBlockingState = (state: string) => state === INPUT_STATES.DISABLED || state === INPUT_STATES.BLOCKED_MODAL || state === INPUT_STATES.BLOCKED_DRAG;

// Verificar anti-padrão
export const checkForbiddenPattern = (cssText: string) => {
  for (const item of FORBIDDEN_PATTERNS) {
    if (cssText.toLowerCase().indexOf(item.pattern.toLowerCase()) !== -1) {
      return { forbidden: true, pattern: item.pattern, reason: item.reason, alternative: item.alternative };
    }
  }
  return { forbidden: false };
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, statesCount: Object.keys(INPUT_STATES).length, rulesCount: Object.keys(INPUT_RULES).length });

export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { statesReady: Object.keys(INPUT_STATES).length > 0, rulesReady: Object.keys(INPUT_RULES).length > 0, transitionsReady: Object.keys(ALLOWED_TRANSITIONS).length > 0 } });

// Exportar contrato completo
export const InputPolicyContract = Object.freeze({
  VERSION, MODULE_ID, INPUT_STATES, BLOCK_PRIORITIES, FORBIDDEN_PATTERNS, INPUT_RULES, ALLOWED_TRANSITIONS,
  isValidTransition, getStatePriority, isBlockingState, checkForbiddenPattern, info, healthCheck
});

export default InputPolicyContract;
