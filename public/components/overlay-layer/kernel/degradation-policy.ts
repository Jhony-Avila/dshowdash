
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ELEVATION)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-kernel:degradation-policy
// PURPOSE: Overlay Degradation Policy - Declarative Runtime Policies
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   OVERLAY_PRIORITY, getTypeById from ./overlay-manifest.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   POLICY_ACTIONS — exported value
//   DEGRADATION_POLICIES — exported value
//   evaluatePolicy() — exported function
//   shouldForceClose() — exported function
//   getOverlaysToForceClose() — exported function
//   isAllowedInMode() — exported function
//   getPolicyForMode() — exported function
//   getAllowedTypesForMode() — exported function
//   getModeMessage() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { OVERLAY_PRIORITY, getTypeById } from './overlay-manifest.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-ELEVATION';
export const MODULE_ID = 'overlay-kernel:degradation-policy';

// ============================================================================
// POLICY ACTIONS
// ============================================================================

export const POLICY_ACTIONS = Object.freeze({
  ALLOW: 'allow',           // Permite abertura normal
  BLOCK: 'block',           // Bloqueia completamente
  QUEUE: 'queue',           // Enfileira para quando sair do modo
  DOWNGRADE: 'downgrade',   // Abre com funcionalidade reduzida
  FORCE_CLOSE: 'force-close' // Fecha overlays existentes deste tipo
});

// ============================================================================
// DEGRADATION POLICIES BY MODE
// ============================================================================

export const DEGRADATION_POLICIES = Object.freeze({
  
  // Modo NORMAL - tudo permitido
  NORMAL: {
    description: 'Operação normal - todos os overlays permitidos',
    defaultAction: POLICY_ACTIONS.ALLOW,
    rules: []
  },
  
  // Modo DEGRADED - apenas essenciais
  DEGRADED: {
    description: 'Modo degradado - apenas overlays essenciais e críticos',
    defaultAction: POLICY_ACTIONS.BLOCK,
    rules: [
      { priority: { min: OVERLAY_PRIORITY.CRITICAL }, action: POLICY_ACTIONS.ALLOW },
      { priority: { min: OVERLAY_PRIORITY.HIGH }, action: POLICY_ACTIONS.ALLOW },
      { type: 'toast', action: POLICY_ACTIONS.ALLOW },
      { type: 'loading', action: POLICY_ACTIONS.ALLOW },
      { typeId: 'login-modal', action: POLICY_ACTIONS.ALLOW },
      { typeId: 'error-modal', action: POLICY_ACTIONS.ALLOW },
      { typeId: 'confirmation-modal', action: POLICY_ACTIONS.ALLOW }
    ],
    forceClose: [
      { priority: { max: OVERLAY_PRIORITY.LOW }, reason: 'degraded-mode' }
    ]
  },
  
  // Modo MAINTENANCE - apenas informativos e login
  MAINTENANCE: {
    description: 'Modo manutenção - apenas toasts informativos e login',
    defaultAction: POLICY_ACTIONS.BLOCK,
    rules: [
      { typeId: 'login-modal', action: POLICY_ACTIONS.ALLOW },
      { typeId: 'error-modal', action: POLICY_ACTIONS.ALLOW },
      { type: 'toast', action: POLICY_ACTIONS.ALLOW },
      { type: 'loading', action: POLICY_ACTIONS.ALLOW }
    ],
    forceClose: [
      { type: 'drawer', reason: 'maintenance-mode' },
      { type: 'modal', except: ['login-modal', 'error-modal'], reason: 'maintenance-mode' }
    ],
    message: 'Sistema em manutenção. Funcionalidades limitadas.'
  },
  
  // Modo RECOVERY - mínimo necessário
  RECOVERY: {
    description: 'Modo recuperação - apenas críticos',
    defaultAction: POLICY_ACTIONS.BLOCK,
    rules: [
      { priority: { min: OVERLAY_PRIORITY.CRITICAL }, action: POLICY_ACTIONS.ALLOW },
      { typeId: 'login-modal', action: POLICY_ACTIONS.ALLOW },
      { typeId: 'error-modal', action: POLICY_ACTIONS.ALLOW },
      { type: 'toast', action: POLICY_ACTIONS.ALLOW }
    ],
    forceClose: [
      { priority: { max: OVERLAY_PRIORITY.NORMAL }, reason: 'recovery-mode' }
    ]
  },
  
  // Modo FAILED - apenas erros e login
  FAILED: {
    description: 'Modo falha - apenas modais de erro e login',
    defaultAction: POLICY_ACTIONS.BLOCK,
    rules: [
      { typeId: 'login-modal', action: POLICY_ACTIONS.ALLOW },
      { typeId: 'error-modal', action: POLICY_ACTIONS.ALLOW },
      { type: 'toast', action: POLICY_ACTIONS.ALLOW, downgrade: { autoCloseDelay: 3000 } }
    ],
    forceClose: [
      { all: true, except: ['login-modal', 'error-modal'], reason: 'system-failed' }
    ],
    message: 'Sistema em estado de falha. Contate o suporte.'
  },
  
  // Modo INITIALIZING - apenas preloader e erros
  INITIALIZING: {
    description: 'Inicializando - apenas preloader e erros críticos',
    defaultAction: POLICY_ACTIONS.QUEUE,
    rules: [
      { typeId: 'preloader', action: POLICY_ACTIONS.ALLOW },
      { typeId: 'error-modal', action: POLICY_ACTIONS.ALLOW },
      { type: 'loading', action: POLICY_ACTIONS.ALLOW }
    ]
  }
});

// ============================================================================
// POLICY ENGINE
// ============================================================================

function _matchesRule(rule: DynObj, typeId: string, typeDef: DynObj) {
  // Match por typeId específico
  if (rule.typeId && rule.typeId === typeId) {
    return true;
  }
  
  // Match por tipo de overlay
  if (rule.type && typeDef && typeDef.type === rule.type) {
    // Verificar exceções
    if (rule.except && rule.except.indexOf(typeId) !== -1) {
      return false;
    }
    return true;
  }
  
  // Match por prioridade mínima
  if (rule.priority && rule.priority.min !== undefined && typeDef) {
    if (typeDef.priority >= rule.priority.min) {
      return true;
    }
  }
  
  // Match por prioridade máxima
  if (rule.priority && rule.priority.max !== undefined && typeDef) {
    if (typeDef.priority <= rule.priority.max) {
      return true;
    }
  }
  
  // Match all
  if (rule.all === true) {
    if (rule.except && rule.except.indexOf(typeId) !== -1) {
      return false;
    }
    return true;
  }
  
  return false;
}

export function evaluatePolicy(mode: DynObj, typeId: string) {
  const policy = (DEGRADATION_POLICIES as DynObj)[mode];
  
  if (!policy) {
    // Modo desconhecido - assume NORMAL
    return {
      action: POLICY_ACTIONS.ALLOW,
      reason: 'unknown-mode-fallback',
      mode
    };
  }
  
  const typeDef = getTypeById(typeId);
  
  // Verificar regras específicas
  const rules = policy.rules || [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (_matchesRule(rule, typeId, typeDef)) {
      return {
        action: rule.action,
        reason: 'rule-match',
        rule,
        mode,
        downgrade: rule.downgrade || null
      };
    }
  }
  
  // Nenhuma regra específica - usar ação padrão
  return {
    action: policy.defaultAction,
    reason: 'default-policy',
    mode,
    message: policy.message || null
  };
}

export function shouldForceClose(mode: DynObj, typeId: string) {
  const policy = (DEGRADATION_POLICIES as DynObj)[mode];
  
  if (!policy || !policy.forceClose) {
    return { shouldClose: false };
  }
  
  const typeDef = getTypeById(typeId);
  const forceCloseRules = policy.forceClose;
  
  for (let i = 0; i < forceCloseRules.length; i++) {
    const rule = forceCloseRules[i];
    if (_matchesRule(rule, typeId, typeDef)) {
      return {
        shouldClose: true,
        reason: rule.reason || 'policy-force-close',
        rule
      };
    }
  }
  
  return { shouldClose: false };
}

export function getOverlaysToForceClose(mode: DynObj, currentStack: DynObj) {
  const toClose = [];
  
  for (let i = 0; i < currentStack.length; i++) {
    const overlay = currentStack[i];
    const typeId = overlay.typeId || overlay.id || overlay.type;
    const result = shouldForceClose(mode, typeId);
    
    if (result.shouldClose) {
      toClose.push({
        id: overlay.id || overlay.handle,
        typeId,
        reason: result.reason
      });
    }
  }
  
  return toClose;
}

export function isAllowedInMode(mode: DynObj, typeId: string) {
  const result = evaluatePolicy(mode, typeId);
  return result.action === POLICY_ACTIONS.ALLOW;
}

export function getPolicyForMode(mode: DynObj) {
  return (DEGRADATION_POLICIES as DynObj)[mode] || null;
}

export function getAllowedTypesForMode(mode: DynObj) {
  const policy = (DEGRADATION_POLICIES as DynObj)[mode];
  if (!policy) return [];
  
  const allowed = [];
  const rules = policy.rules || [];
  
  for (let i = 0; i < rules.length; i++) {
    if (rules[i].action === POLICY_ACTIONS.ALLOW) {
      if (rules[i].typeId) {
        allowed.push(rules[i].typeId);
      }
    }
  }
  
  return allowed;
}

export function getModeMessage(mode: DynObj) {
  const policy = (DEGRADATION_POLICIES as DynObj)[mode];
  return policy ? policy.message || null : null;
}

// ============================================================================
// ENTERPRISE API
// ============================================================================

export function healthCheck() {
  const modes = Object.keys(DEGRADATION_POLICIES);
  const checks = {
    hasPolicies: modes.length > 0,
    hasNormalMode: !!DEGRADATION_POLICIES.NORMAL,
    hasDegradedMode: !!DEGRADATION_POLICIES.DEGRADED,
    hasFailedMode: !!DEGRADATION_POLICIES.FAILED,
    allModesValid: true
  };
  
  // Verificar se todos os modos têm estrutura válida
  for (let i = 0; i < modes.length; i++) {
    const policy = (DEGRADATION_POLICIES as DynObj)[modes[i]];
    if (!policy.defaultAction || !policy.description) {
      checks.allModesValid = false;
      break;
    }
  }
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let j = 0; j < keys.length; j++) {
    if ((checks as DynObj)[keys[j]]) passed++;
  }
  
  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: keys.length,
    scoreDisplay: `${passed}/${keys.length}`,
    checks,
    modes,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

export function info() {
  const modes = Object.keys(DEGRADATION_POLICIES);
  const modeInfo = {};
  
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const policy = (DEGRADATION_POLICIES as DynObj)[mode];
    (modeInfo as DynObj)[mode] = {
      description: policy.description,
      defaultAction: policy.defaultAction,
      rulesCount: (policy.rules || []).length,
      forceCloseRulesCount: (policy.forceClose || []).length,
      hasMessage: !!policy.message
    };
  }
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modesCount: modes.length,
    modes: modeInfo,
    actions: Object.keys(POLICY_ACTIONS),
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  POLICY_ACTIONS,
  DEGRADATION_POLICIES,
  evaluatePolicy,
  shouldForceClose,
  getOverlaysToForceClose,
  isAllowedInMode,
  getPolicyForMode,
  getAllowedTypesForMode,
  getModeMessage,
  healthCheck,
  info
};
