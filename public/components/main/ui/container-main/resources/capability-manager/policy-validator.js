import { DENIAL_REASONS, CAPABILITY_POLICIES } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.capability-manager.policy-validator";
function createPolicyValidator(options = {}) {
  const {
    policy = CAPABILITY_POLICIES.ON_DEMAND,
    whitelist = [],
    blacklist = [],
    platformConfig
  } = options;
  return {
    // Verifica se capacidade está disponível na plataforma
    isPlatformCapabilityAvailable(capability) {
      const config = platformConfig?.[capability];
      return config?.available === true;
    },
    // Verifica limite de concorrência
    checkConcurrencyLimit(capability, currentCount) {
      const config = platformConfig?.[capability];
      if (!config) return true;
      return currentCount < config.maxConcurrent;
    },
    // Aplica política
    applyPolicy(panelId, capability) {
      switch (policy) {
        case CAPABILITY_POLICIES.ALLOW_ALL:
          return { allowed: true };
        case CAPABILITY_POLICIES.DENY_ALL:
          return { allowed: false, reason: DENIAL_REASONS.POLICY };
        case CAPABILITY_POLICIES.WHITELIST:
          if (!whitelist.includes(capability)) {
            return { allowed: false, reason: DENIAL_REASONS.POLICY };
          }
          return { allowed: true };
        case CAPABILITY_POLICIES.BLACKLIST:
          if (blacklist.includes(capability)) {
            return { allowed: false, reason: DENIAL_REASONS.POLICY };
          }
          return { allowed: true };
        case CAPABILITY_POLICIES.ON_DEMAND:
        default:
          return { allowed: true };
      }
    },
    // Valida request completo
    validateRequest(panelId, capability, currentCount) {
      if (!this.isPlatformCapabilityAvailable(capability)) {
        return { valid: false, reason: DENIAL_REASONS.NOT_AVAILABLE };
      }
      const policyResult = this.applyPolicy(panelId, capability);
      if (!policyResult.allowed) {
        return { valid: false, reason: policyResult.reason };
      }
      if (!this.checkConcurrencyLimit(capability, currentCount)) {
        return { valid: false, reason: DENIAL_REASONS.RESOURCE_LIMIT };
      }
      return { valid: true };
    },
    getPolicy() {
      return policy;
    }
  };
}
var policy_validator_default = { createPolicyValidator };
export {
  MODULE_ID,
  VERSION,
  createPolicyValidator,
  policy_validator_default as default
};
