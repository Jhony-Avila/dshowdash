import { OVERLAY_PRIORITY, getTypeById } from "./overlay-manifest.js";
const VERSION = "1.0.0-ELEVATION";
const MODULE_ID = "overlay-kernel:degradation-policy";
const POLICY_ACTIONS = Object.freeze({
  ALLOW: "allow",
  // Permite abertura normal
  BLOCK: "block",
  // Bloqueia completamente
  QUEUE: "queue",
  // Enfileira para quando sair do modo
  DOWNGRADE: "downgrade",
  // Abre com funcionalidade reduzida
  FORCE_CLOSE: "force-close"
  // Fecha overlays existentes deste tipo
});
const DEGRADATION_POLICIES = Object.freeze({
  // Modo NORMAL - tudo permitido
  NORMAL: {
    description: "Opera\xE7\xE3o normal - todos os overlays permitidos",
    defaultAction: POLICY_ACTIONS.ALLOW,
    rules: []
  },
  // Modo DEGRADED - apenas essenciais
  DEGRADED: {
    description: "Modo degradado - apenas overlays essenciais e cr\xEDticos",
    defaultAction: POLICY_ACTIONS.BLOCK,
    rules: [
      { priority: { min: OVERLAY_PRIORITY.CRITICAL }, action: POLICY_ACTIONS.ALLOW },
      { priority: { min: OVERLAY_PRIORITY.HIGH }, action: POLICY_ACTIONS.ALLOW },
      { type: "toast", action: POLICY_ACTIONS.ALLOW },
      { type: "loading", action: POLICY_ACTIONS.ALLOW },
      { typeId: "login-modal", action: POLICY_ACTIONS.ALLOW },
      { typeId: "error-modal", action: POLICY_ACTIONS.ALLOW },
      { typeId: "confirmation-modal", action: POLICY_ACTIONS.ALLOW }
    ],
    forceClose: [
      { priority: { max: OVERLAY_PRIORITY.LOW }, reason: "degraded-mode" }
    ]
  },
  // Modo MAINTENANCE - apenas informativos e login
  MAINTENANCE: {
    description: "Modo manuten\xE7\xE3o - apenas toasts informativos e login",
    defaultAction: POLICY_ACTIONS.BLOCK,
    rules: [
      { typeId: "login-modal", action: POLICY_ACTIONS.ALLOW },
      { typeId: "error-modal", action: POLICY_ACTIONS.ALLOW },
      { type: "toast", action: POLICY_ACTIONS.ALLOW },
      { type: "loading", action: POLICY_ACTIONS.ALLOW }
    ],
    forceClose: [
      { type: "drawer", reason: "maintenance-mode" },
      { type: "modal", except: ["login-modal", "error-modal"], reason: "maintenance-mode" }
    ],
    message: "Sistema em manuten\xE7\xE3o. Funcionalidades limitadas."
  },
  // Modo RECOVERY - mínimo necessário
  RECOVERY: {
    description: "Modo recupera\xE7\xE3o - apenas cr\xEDticos",
    defaultAction: POLICY_ACTIONS.BLOCK,
    rules: [
      { priority: { min: OVERLAY_PRIORITY.CRITICAL }, action: POLICY_ACTIONS.ALLOW },
      { typeId: "login-modal", action: POLICY_ACTIONS.ALLOW },
      { typeId: "error-modal", action: POLICY_ACTIONS.ALLOW },
      { type: "toast", action: POLICY_ACTIONS.ALLOW }
    ],
    forceClose: [
      { priority: { max: OVERLAY_PRIORITY.NORMAL }, reason: "recovery-mode" }
    ]
  },
  // Modo FAILED - apenas erros e login
  FAILED: {
    description: "Modo falha - apenas modais de erro e login",
    defaultAction: POLICY_ACTIONS.BLOCK,
    rules: [
      { typeId: "login-modal", action: POLICY_ACTIONS.ALLOW },
      { typeId: "error-modal", action: POLICY_ACTIONS.ALLOW },
      { type: "toast", action: POLICY_ACTIONS.ALLOW, downgrade: { autoCloseDelay: 3e3 } }
    ],
    forceClose: [
      { all: true, except: ["login-modal", "error-modal"], reason: "system-failed" }
    ],
    message: "Sistema em estado de falha. Contate o suporte."
  },
  // Modo INITIALIZING - apenas preloader e erros
  INITIALIZING: {
    description: "Inicializando - apenas preloader e erros cr\xEDticos",
    defaultAction: POLICY_ACTIONS.QUEUE,
    rules: [
      { typeId: "preloader", action: POLICY_ACTIONS.ALLOW },
      { typeId: "error-modal", action: POLICY_ACTIONS.ALLOW },
      { type: "loading", action: POLICY_ACTIONS.ALLOW }
    ]
  }
});
function _matchesRule(rule, typeId, typeDef) {
  if (rule.typeId && rule.typeId === typeId) {
    return true;
  }
  if (rule.type && typeDef && typeDef.type === rule.type) {
    if (rule.except && rule.except.indexOf(typeId) !== -1) {
      return false;
    }
    return true;
  }
  if (rule.priority && rule.priority.min !== void 0 && typeDef) {
    if (typeDef.priority >= rule.priority.min) {
      return true;
    }
  }
  if (rule.priority && rule.priority.max !== void 0 && typeDef) {
    if (typeDef.priority <= rule.priority.max) {
      return true;
    }
  }
  if (rule.all === true) {
    if (rule.except && rule.except.indexOf(typeId) !== -1) {
      return false;
    }
    return true;
  }
  return false;
}
function evaluatePolicy(mode, typeId) {
  const policy = DEGRADATION_POLICIES[mode];
  if (!policy) {
    return {
      action: POLICY_ACTIONS.ALLOW,
      reason: "unknown-mode-fallback",
      mode
    };
  }
  const typeDef = getTypeById(typeId);
  const rules = policy.rules || [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (_matchesRule(rule, typeId, typeDef)) {
      return {
        action: rule.action,
        reason: "rule-match",
        rule,
        mode,
        downgrade: rule.downgrade || null
      };
    }
  }
  return {
    action: policy.defaultAction,
    reason: "default-policy",
    mode,
    message: policy.message || null
  };
}
function shouldForceClose(mode, typeId) {
  const policy = DEGRADATION_POLICIES[mode];
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
        reason: rule.reason || "policy-force-close",
        rule
      };
    }
  }
  return { shouldClose: false };
}
function getOverlaysToForceClose(mode, currentStack) {
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
function isAllowedInMode(mode, typeId) {
  const result = evaluatePolicy(mode, typeId);
  return result.action === POLICY_ACTIONS.ALLOW;
}
function getPolicyForMode(mode) {
  return DEGRADATION_POLICIES[mode] || null;
}
function getAllowedTypesForMode(mode) {
  const policy = DEGRADATION_POLICIES[mode];
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
function getModeMessage(mode) {
  const policy = DEGRADATION_POLICIES[mode];
  return policy ? policy.message || null : null;
}
function healthCheck() {
  const modes = Object.keys(DEGRADATION_POLICIES);
  const checks = {
    hasPolicies: modes.length > 0,
    hasNormalMode: !!DEGRADATION_POLICIES.NORMAL,
    hasDegradedMode: !!DEGRADATION_POLICIES.DEGRADED,
    hasFailedMode: !!DEGRADATION_POLICIES.FAILED,
    allModesValid: true
  };
  for (let i = 0; i < modes.length; i++) {
    const policy = DEGRADATION_POLICIES[modes[i]];
    if (!policy.defaultAction || !policy.description) {
      checks.allModesValid = false;
      break;
    }
  }
  let passed = 0;
  const keys = Object.keys(checks);
  for (let j = 0; j < keys.length; j++) {
    if (checks[keys[j]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
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
function info() {
  const modes = Object.keys(DEGRADATION_POLICIES);
  const modeInfo = {};
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const policy = DEGRADATION_POLICIES[mode];
    modeInfo[mode] = {
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
var degradation_policy_default = {
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
export {
  DEGRADATION_POLICIES,
  MODULE_ID,
  POLICY_ACTIONS,
  VERSION,
  degradation_policy_default as default,
  evaluatePolicy,
  getAllowedTypesForMode,
  getModeMessage,
  getOverlaysToForceClose,
  getPolicyForMode,
  healthCheck,
  info,
  isAllowedInMode,
  shouldForceClose
};
